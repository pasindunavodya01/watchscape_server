import { Link } from "react-router-dom";
import { auth } from "../firebase";

/**
 * Smart profile link.
 * If the target uid matches the currently signed-in user it navigates to
 * /dashboard/my-profile, otherwise it navigates to /dashboard/profile/:uid.
 *
 * Props:
 *   uid        – the target user's uid
 *   className  – forwarded to the underlying <Link>
 *   children   – link content
 */
export default function ProfileLink({ uid, className, children }) {
  const isMe = auth?.currentUser?.uid && uid === auth.currentUser.uid;
  const to = isMe ? "/dashboard/my-profile" : `/dashboard/profile/${uid}`;
  return (
    <Link to={to} className={className}>
      {children}
    </Link>
  );
}
