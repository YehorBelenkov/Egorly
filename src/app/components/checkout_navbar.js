import Link from "next/link";
import './checkoutnav.css';
import '../globals.css';

const CheckoutNav = ()=>{
return (
    <>
        <div className="checkout_nav_body_container">
            <Link className="checkout_nav_link" href="/"><img className="logo_img" src="/images/bariga_logo.png" alt="logo"/>Egorly</Link>
            <Link href={"/cart"}><img className="cart_img" src="/images/cart_img.png" alt="cart icon" /></Link>
        </div>
    </>
);
};
export default CheckoutNav;