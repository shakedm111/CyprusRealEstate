// Using the original Telem Nadlan logo
import telemLogoImage from "../assets/telem-logo.png";

export const TelemLogo = ({ className = "h-10", width = "auto" }: { className?: string, width?: string }) => {
  return (
    <img 
      src={telemLogoImage} 
      alt="Telem Nadlan Logo" 
      className={className}
      style={{ width: width !== "auto" ? width : undefined, height: "auto" }}
    />
  );
};

export default TelemLogo;
