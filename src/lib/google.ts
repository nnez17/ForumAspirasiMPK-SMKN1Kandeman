import { google } from "googleapis";

// load the environment variable with our keys
const keysEnvVar = import.meta.env.GOOGLE_SERVICE_ACCOUNT;
if (!keysEnvVar) {
	throw new Error(
		"The $GOOGLE_SERVICE_ACCOUNT environment variable was not found!",
	);
}
const keys = JSON.parse(keysEnvVar);

// create a JWT client
const auth = new google.auth.JWT({
	email: keys.client_email,
	key: keys.private_key,
	scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

export const sheets = google.sheets({ version: "v4", auth });
