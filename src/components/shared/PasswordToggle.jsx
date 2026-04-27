import { Eye, EyeOff } from "lucide-react";
const PasswordToggle = ({ show, onToggle, className }) => {
    return (<button type="button" onClick={onToggle} className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 ${className}`}>
      {show ? <EyeOff size={20}/> : <Eye size={20}/>}
    </button>);
};
export default PasswordToggle;
