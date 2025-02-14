import { useUser } from "src/contexts/UserContext";
import styles from "./navbar.module.scss";

const Navbar = ({ }) => {

   const { user } = useUser();

   return <div className={styles.navbar}>{user.name}#{user.id}</div>;
};

export default Navbar;
