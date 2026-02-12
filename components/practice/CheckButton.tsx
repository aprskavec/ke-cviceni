import { cn } from "@/lib/utils";

interface CheckButtonProps {
  onClick: () => void;
  disabled?: boolean;
  show?: boolean;
  label?: string;
}

const CheckButton = ({ 
  onClick, 
  disabled = false, 
  show = true,
  label = "Zkontrolovat"
}: CheckButtonProps) => {
  if (!show) return null;

  return (
    <div 
      className={cn(
        "fixed left-0 right-0 z-40 flex justify-center",
        "p-4 bg-gradient-to-t from-background via-background to-transparent",
        // On mobile: stick to bottom with safe area padding for keyboard
        "bottom-0 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
      )}
    >
      <button
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "w-full max-w-md py-4 rounded-full bg-primary text-primary-foreground",
          "font-['Champ'] font-bold text-lg",
          "hover:opacity-90 active:scale-[0.98] transition-[opacity,transform] duration-200",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        {label}
      </button>
    </div>
  );
};

export default CheckButton;
