import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Navbar from "./Navbar";
import Footer from "./Footer";
import DiscountBanner from "./DiscountBanner";
import "./layout.css";

import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { app } from "../../lib/firebaseConfig";

const Layout = ({ children }) => {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    const auth = getAuth(app);
    try {
      await signOut(auth);
      setUser(null);
      router.push("/");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return (
    <div className="main_body">
      <DiscountBanner />
      <Navbar user={user} onLogout={handleLogout} />
      <div className="content_wrapper">
        {/* ✅ pass user and onLogout down to all pages */}
        {children && typeof children === "function" ? children(user, handleLogout) : children}
      </div>
      <Footer />
    </div>
  );
};

export default Layout;