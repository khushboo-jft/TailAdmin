import { message } from "antd";
import axios from "axios";

type jwtReturnType = {
  companyId: string;
  companyName?: string;
  email: string;
  exp: number;
  iat: number;
  id: string;
  name: string;
  role: string;
  status: boolean;
};

/**
 * Decode a JSON Web Token (JWT) and return the decoded payload or an object with a status of false if there's an error.
 *
 * @param {string} token - The JWT to decode.
 * @return {jwtReturnType | { status: boolean }} - The decoded payload or an object with a status of false.
 */
function jwtDecode(token: string): jwtReturnType | { status: boolean } {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );

    const payload = JSON.parse(jsonPayload);

    return Object.assign(payload, { status: true });
  } catch (error) {
    return { status: false };
  }
}

/**
 * Checks if a given access token is valid.
 *
 * @param {string} accessToken - The access token to validate.
 * @return {boolean} - Returns true if the access token is valid, false otherwise.
 */
function isValidToken(accessToken: string): boolean {
  if (!accessToken) {
    return false;
  }

  const decoded = jwtDecode(accessToken) as jwtReturnType;

  const currentTime = Date.now() / 1000;

  return decoded.exp > currentTime;
}

/**
 * Sets a timer to execute a callback function when a token expires.
 *
 * @param {number} exp - The expiration time of the token in seconds.
 * @return {void} This function does not return a value.
 */
function tokenExpired(exp: number): void {
  let expiredTimer;

  const currentTime = Date.now();

  const timeLeft = exp * 1000 - currentTime;

  clearTimeout(expiredTimer);

  expiredTimer = setTimeout(() => {
    message.error("token expired");

    localStorage.removeItem("accessToken");

    window.location.href = "/login";
  }, timeLeft);
}

/**
 * Sets the session by storing the access token in the local storage and setting it as the default authorization header for axios requests.
 * If the access token is null, it removes the access token from the local storage and removes the authorization header from axios requests.
 *
 * @param {string | null} accessToken - The access token to set for the session.
 * @return {void} This function does not return anything.
 */
function setSession(accessToken: string | null): void {
  if (accessToken) {
    localStorage.setItem("accessToken", accessToken);
    axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;
    const decoded = jwtDecode(accessToken) as jwtReturnType;

    //track token expiry and logout user if token expired
    tokenExpired(decoded.exp);
  } else {
    localStorage.removeItem("accessToken");
    axios.defaults.headers.common["Authorization"];
  }
}

export { jwtDecode, setSession, isValidToken, tokenExpired };
