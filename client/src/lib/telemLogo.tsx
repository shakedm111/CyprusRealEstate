// SVG recreation of the Telem Nadlan logo
export const TelemLogo = ({ className = "h-10", width = "auto" }: { className?: string, width?: string }) => {
  return (
    <svg 
      className={className} 
      width={width} 
      viewBox="0 0 400 140" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Grey and Teal building blocks */}
      <g>
        {/* Left building block - grey front */}
        <path d="M50 90L90 70V30L50 50V90Z" fill="#CCCCCC" />
        {/* Left building block - teal side */}
        <path d="M90 70L130 90V50L90 30V70Z" fill="#3CBFB4" />
        
        {/* Right building block - grey front */}
        <path d="M90 40L130 20V0L90 20V40Z" fill="#CCCCCC" />
        {/* Right building block - teal side */}
        <path d="M130 20L170 40V20L130 0V20Z" fill="#3CBFB4" />
      </g>
      
      {/* TELEM text */}
      <g fill="#666666">
        <path d="M200 40H240V50H225V90H215V50H200V40Z" />
        <path d="M245 40H290V50H255V60H285V70H255V80H290V90H245V40Z" />
        <path d="M295 40H305V80H340V90H295V40Z" />
        <path d="M345 40H390V50H370V90H360V50H345V40Z" />
      </g>
      
      {/* NADLAN text (smaller) */}
      <g fill="#999999">
        <path d="M245 100H250V110H255V100H260V120H255V115H250V120H245V100Z" />
        <path d="M265 100H270L275 112.5L280 100H285V120H280V110L276.5 120H273.5L270 110V120H265V100Z" />
        <path d="M290 100H295V110H300V100H305V110H310V100H315V120H310V115H305V120H300V115H295V120H290V100Z" />
        <path d="M320 100H325V115H335V120H320V100Z" />
        <path d="M340 100H345L350 112.5L355 100H360V120H355V110L351.5 120H348.5L345 110V120H340V100Z" />
        <path d="M365 100H380V105H370V107.5H380V112.5H370V115H380V120H365V100Z" />
      </g>
    </svg>
  );
};

export default TelemLogo;
