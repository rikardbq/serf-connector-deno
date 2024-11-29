// util/index.ts
export * from "./jwt.ts";
export * from "./migration.ts";

/**
 * 
 * @param {string} input 
 * @param {TextEncoder} encoder 
 * @returns {string} a sha256 hash of the input
 */
export const generateSHA256 = async (input: string, encoder: TextEncoder) => {
    const text_as_buffer = encoder.encode(input);
    const hash_buffer = await globalThis.crypto.subtle.digest(
        "SHA-256",
        text_as_buffer,
    );
    const hash_arr = Array.from(new Uint8Array(hash_buffer));
    const hash = hash_arr
        .map((item) => item.toString(16).padStart(2, "0"))
        .join("");

    return hash;
};
