import {
  readdir,
  mkdir,
  rename,
  stat,
  realpath,
  access,
} from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";

type Directory = "desktop" | "downloads" | "documents" | "pictures";

type FileAction =
  | { type: "list_files"; directory: Directory }
  | {
      type: "create_folder";
      directory: Directory;
      folderName: string;
    }
  | {
      type: "move_file";
      source: string;
      destination: string;
    }
  | {
      type: "find_file";
      query: string;
      searchScope?: "common_folders" | "entire_computer" | "selected_folder";
      folderPath?: string;
      fileType?: string;
      maxResults?: number;
    };

const home = homedir();

const directories: Record<Directory, string> = {
  desktop: path.join(home, "Desktop"),
  downloads: path.join(home, "Downloads"),
  documents: path.join(home, "Documents"),
  pictures: path.join(home, "Pictures"),
};

const blockedDirectories = new Set([
  "$Recycle.Bin",
  "System Volume Information",
  "Windows",
  "node_modules",
  ".git",
]);

function isInside(parent: string, target: string) {
  const relative = path.relative(parent, target);

  return (
    relative === "" ||
    (!relative.startsWith(`..${path.sep}`) &&
      relative !== ".." &&
      !path.isAbsolute(relative))
  );
}

async function ensureUserPath(input: string) {
  if (!path.isAbsolute(input)) {
    throw new Error("An absolute file path is required.");
  }

  const resolved = path.resolve(input);

  // File modifications are restricted to the user's home directory.
  if (!isInside(home, resolved)) {
    throw new Error("File operations outside your user folder are blocked.");
  }

  return resolved;
}

export async function listFiles(directory: Directory) {
  const target = directories[directory];

  if (!target) throw new Error("Unsupported directory.");

  const entries = await readdir(target, { withFileTypes: true });

  return entries.map((entry: any) => ({
    name: entry.name,
    type: entry.isDirectory() ? "folder" : "file",
    path: path.join(target, entry.name),
  }));
}

export async function createFolder(directory: Directory, folderName: string) {
  if (
    !folderName.trim() ||
    folderName === "." ||
    folderName === ".." ||
    /[<>:"/\\|?*\x00-\x1f]/.test(folderName)
  ) {
    throw new Error("Invalid folder name.");
  }

  const parent = directories[directory];

  if (!parent) {
    throw new Error("Unsupported directory.");
  }

  const target = path.join(parent, folderName);

  try {
    await mkdir(target, { recursive: false });

    return {
      success: true,
      status: "created" as const,
      message: `Folder "${folderName}" was created successfully on your ${directory}.`,
      path: target,
      created: true,
    };
  } catch (error) {
    const fsError = error as NodeJS.ErrnoException;

    if (fsError.code === "EEXIST") {
      const existing = await stat(target);

      if (existing.isDirectory()) {
        return {
          success: false,
          status: "already_exists" as const,
          message: `The folder "${folderName}" already exists on your ${directory}. No new folder was created.`,
          path: target,
          created: false,
        };
      }

      throw new Error(
        `A file named "${folderName}" already exists on your ${directory}.`,
      );
    }

    throw error;
  }
}

export async function moveFile(source: string, destination: string) {
  const safeSource = await ensureUserPath(source);
  const safeDestination = await ensureUserPath(destination);

  // Resolve the source to catch symlinks escaping the user folder.
  const actualSource = await realpath(safeSource);
  const sourceInfo = await stat(actualSource);

  if (!isInside(home, actualSource)) {
    throw new Error("Source points outside the user folder.");
  }

  if (!sourceInfo.isFile()) {
    throw new Error("Only files can be moved.");
  }

  // Destination is the complete destination file path.
  // Its parent folder must already exist.
  const destinationParent = await realpath(path.dirname(safeDestination));

  if (!isInside(home, destinationParent)) {
    throw new Error("Destination points outside the user folder.");
  }

  const finalDestination = path.join(
    destinationParent,
    path.basename(safeDestination),
  );

  if (actualSource === finalDestination) {
    throw new Error("Source and destination are the same.");
  }

  // Never overwrite an existing file.
  try {
    await access(finalDestination);
    throw new Error("A file already exists at the destination.");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }

  await rename(actualSource, finalDestination);

  return {
    moved: true,
    source: actualSource,
    destination: finalDestination,
  };
}

function matchesFileType(filePath: string, fileType?: string) {
  const ext = path.extname(filePath).toLowerCase();

  const extensions: Record<string, string[]> = {
    image: [".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp", ".svg"],
    video: [".mp4", ".mov", ".mkv", ".avi", ".webm"],
    audio: [".mp3", ".wav", ".aac", ".flac", ".ogg"],
    document: [".doc", ".docx", ".txt", ".rtf", ".odt"],
    pdf: [".pdf"],
    spreadsheet: [".xls", ".xlsx", ".csv"],
    presentation: [".ppt", ".pptx"],
    archive: [".zip", ".rar", ".7z", ".tar", ".gz"],
    code: [".ts", ".tsx", ".js", ".jsx", ".py", ".java", ".go"],
  };

  if (!fileType || fileType === "any") return true;

  return extensions[fileType]?.includes(ext) ?? false;
}

async function searchDirectory(
  root: string,
  query: string,
  fileType: string | undefined,
  results: Array<{ name: string; path: string; type: string }>,
  maxResults: number,
) {
  const stack = [root];
  const needle = query.toLowerCase();

  while (stack.length && results.length < maxResults) {
    const current = stack.pop()!;

    let entries;

    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch {
      // Skip inaccessible directories instead of crashing the scan.
      continue;
    }

    for (const entry of entries) {
      if (results.length >= maxResults) break;

      if (entry.isDirectory() && blockedDirectories.has(entry.name)) {
        continue;
      }

      const fullPath = path.join(current, entry.name);

      if (entry.isDirectory()) {
        // Do not follow symlinks or junctions.
        stack.push(fullPath);
        continue;
      }

      if (
        entry.isFile() &&
        entry.name.toLowerCase().includes(needle) &&
        matchesFileType(entry.name, fileType)
      ) {
        results.push({
          name: entry.name,
          path: fullPath,
          type: "file",
        });
      }
    }
  }
}

export async function findFiles(
  action: Extract<FileAction, { type: "find_file" }>,
) {
  const results: Array<{
    name: string;
    path: string;
    type: string;
  }> = [];

  const maxResults = action.maxResults ?? 50;

  let roots: string[];

  if (action.searchScope === "selected_folder") {
    if (!action.folderPath) {
      throw new Error("A folder path is required.");
    }

    const folder = await ensureUserPath(action.folderPath);
    roots = [await realpath(folder)];
  } else if (action.searchScope === "entire_computer") {
    if (process.platform === "win32") {
      const drives = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

      roots = [];

      for (const drive of drives) {
        const root = `${drive}:\\`;

        try {
          await access(root);
          roots.push(root);
        } catch {
          // Drive not available.
        }
      }
    } else {
      // Search the user's files on non-Windows systems.
      roots = [home];
    }
  } else {
    roots = Object.values(directories);
  }

  for (const root of roots) {
    await searchDirectory(
      root,
      action.query,
      action.fileType,
      results,
      maxResults,
    );

    if (results.length >= maxResults) break;
  }

  return { results, count: results.length };
}

export async function executeAction(action: FileAction) {
  switch (action.type) {
    case "list_files":
      return listFiles(action.directory);

    case "create_folder":
      return createFolder(action.directory, action.folderName);

    case "move_file":
      return moveFile(action.source, action.destination);

    case "find_file":
      return findFiles(action);

    default:
      throw new Error("Unsupported action.");
  }
}
