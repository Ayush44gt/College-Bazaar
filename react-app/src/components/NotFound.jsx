import { Link } from "react-router-dom";
import { FiCompass } from "react-icons/fi";
import { State } from "./ui";

function NotFound() {
  return (
    <div className="page">
      <State icon={<FiCompass />} title="Page not found" text="The page you are looking for does not exist or has moved.">
        <Link className="btn" to="/">Back to home</Link>
      </State>
    </div>
  );
}

export default NotFound;
