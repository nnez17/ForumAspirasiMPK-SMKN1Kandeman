import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const getServiceAccount = () => {
	const sa = import.meta.env.FIREBASE_SERVICE_ACCOUNT;
	if (!sa) return {};
	try {
		// Try parsing as plain JSON
		return JSON.parse(sa);
	} catch {
		try {
			// Try parsing as base64
			return JSON.parse(Buffer.from(sa, "base64").toString());
		} catch {
			console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT");
			return {};
		}
	}
};

const serviceAccount = getServiceAccount();

const app =
	getApps().length === 0
		? initializeApp({
				credential: cert(serviceAccount),
			})
		: getApp();

export const db = getFirestore(app);
