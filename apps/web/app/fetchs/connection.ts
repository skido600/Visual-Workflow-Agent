// async function handleConnectDevice() {
//   try {
//     setConnecting(true);

//     const response = await fetch(
//       `${process.env.NEXT_PUBLIC_API_URL}/v1/agent/start`,
//       {
//         method: "POST",
//         credentials: "include",
//       },
//     );

//     const result = await response.json();

//     if (!response.ok) {
//       throw new Error(result.message || "Could not start pairing");
//     }

//     window.location.href = result.data.verificationUrl;
//   } catch (error) {
//     console.error(error);
//   } finally {
//     setConnecting(false);
//   }
// }
