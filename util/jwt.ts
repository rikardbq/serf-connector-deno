// util/jwt.ts
import { decodeJwt, jwtVerify, type JWTVerifyResult, SignJWT } from "jose";

enum Iss {
    CLIENT = "C_",
    SERVER = "S_",
}

export enum Sub {
    MUTATE = "M_",
    FETCH = "F_",
    DATA = "D_",
}

export type Dat = {
    base_query: string;
    parts: (number | string)[] | [];
};

type Claims = {
    iss: Iss;
    sub: Sub;
    dat: string;
    iat: number;
    exp: number;
};

/**
 * @param {Sub} sub
 * @param {Dat} dat
 * @returns {Claims} JWT claims
 */
export const generateClaims = (sub: Sub, dat: Dat): Claims => {
    const now = Math.floor(Date.now() / 1000);

    return {
        iss: Iss.CLIENT,
        sub,
        dat: JSON.stringify(dat),
        iat: now,
        exp: now + 30,
    };
};

/**
 * @param {Claims} claims
 * @param {Uint8Array} username_password_hash
 * @returns {Promise<string>} thenable / awaitable JWS token string
 */
export const generateJWS = async (
    claims: Claims,
    username_password_hash: Uint8Array,
): Promise<string> => {
    return await new SignJWT(claims)
        .setProtectedHeader({ alg: "HS256" })
        .sign(username_password_hash);
};

/**
 * @param {string} token
 * @param {Uint8Array} username_password_hash
 * @returns {Promise<JWTVerifyResult<Claims>>} a thenable / awaitable verify result containing claims set and protected headers
 */
export const verifyJWT = async (
    token: string,
    username_password_hash: Uint8Array,
): Promise<JWTVerifyResult<Claims>> => {
    return await jwtVerify(
        token,
        username_password_hash,
        {
            algorithms: ["HS256"],
            issuer: Iss.SERVER,
            subject: Sub.DATA,
        },
    );
};

/**
 * @param {string} token
 * @returns {Claims} the decoded token claims set
 */
export const decodeJWT = (token: string): Claims => {
    return decodeJwt(token);
};
