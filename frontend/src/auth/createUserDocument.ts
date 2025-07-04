import { db } from "./firebase";
import { doc, setDoc } from "firebase/firestore";

export const createUserDocument = async (uid: string, email: string | null) => {
  await setDoc(doc(db, "users", uid), {
    email: email,
    name: '',
    phone: '',
    createdAt: new Date(),
  });
};
