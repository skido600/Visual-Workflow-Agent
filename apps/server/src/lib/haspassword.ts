import argon2 from "argon2";

export const hashPassword = async (password: string): Promise<string> => {
  return argon2.hash(password);
};
export const verifyPassword = (password: string, passwordHash: string) =>
  argon2.verify(passwordHash, password);
