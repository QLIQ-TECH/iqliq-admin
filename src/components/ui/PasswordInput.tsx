'use client';

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";

type PasswordInputProps = React.ComponentProps<typeof Input>;

const PasswordInput = ({ className, ...props }: PasswordInputProps) => {
  const [show, setShow] = useState(false);

  return (
    <div className="relative w-full">
      <Input
        type={show ? "text" : "password"}
        className={`pr-10 ${className}`} 
        {...props}
      />
      <button
        type="button"
        onClick={() => setShow((prev) => !prev)}
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        {show ? <EyeOff size={20} /> : <Eye size={20} />}
      </button>
    </div>
  );
};

export default PasswordInput;
