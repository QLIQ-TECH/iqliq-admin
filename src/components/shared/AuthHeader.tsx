type AuthHeaderProps = {
    title: string;
    description?: string;
  };
  
  const AuthHeader = ({ title, description }: AuthHeaderProps) => (
    <div className="space-y-3 sm:space-y-5 text-center sm:text-left">
      <h1 className="font-semibold text-3xl sm:text-4xl">{title}</h1>
      {description && (
        <p className="font-semibold text-sm sm:text-base ml-1">{description}</p>
      )}
    </div>
  );
  
  export default AuthHeader;
  