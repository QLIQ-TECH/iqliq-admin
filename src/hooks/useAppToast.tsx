// src/hooks/useAppToast.ts
import { toast } from "sonner";
import {
  CheckCircle,
  XCircle,
  Info,
  AlertTriangle,
  Rocket,
} from "lucide-react";


export const useAppToast = () => {
  return {
    success: (title: string, description?: string) =>
      toast.success(title, {
        description,
        icon: <CheckCircle className="text-green-500" />,
        duration: 3000,
      }),

    error: (title: string, description?: string) =>
      toast.error(title, {
        description,
        icon: <XCircle className="text-red-500" />,
        duration: 4000,
      }),

    info: (title: string, description?: string) =>
      toast(title, {
        description,
        icon: <Info className="text-blue-500" />,
        duration: 3000,
      }),

    warning: (title: string, description?: string) =>
      toast.warning(title, {
        description,
        icon: <AlertTriangle className="text-yellow-500" />,
        duration: 3500,
      }),

    custom: (title: string, description?: string) =>
      toast.custom((id) => (
        <div className="w-80 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-4 shadow-lg flex items-start gap-3 text-white">
          {/* Icon */}
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
            <Rocket size={20} />
          </div>

          {/* Content */}
          <div className="flex-1">
            <p className="font-semibold text-sm">{title}</p>
            {description && (
              <p className="text-xs opacity-90">{description}</p>
            )}
          </div>

          {/* Close */}
          <button
            onClick={() => toast.dismiss(id)}
            className="ml-2 text-white/70 hover:text-white text-lg leading-none"
          >
            ×
          </button>
        </div>
      )),
  };
};
