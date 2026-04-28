import clsx from "clsx";

const OnboardingLayout = ({ children, image,  positionStart=false, }) => {

  const imageSrc = typeof image === 'string' ? image : image?.src;

  return (
    <div className="h-screen bg-white p-8 md:p-10 lg:p-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10 lg:gap-16 max-w-7xl mx-auto h-full">
        <div
          className={clsx(
            "flex flex-col h-full overflow-y-auto  items-center",
            { "justify-start": positionStart },
            {"justify-center":!positionStart}


          )}
        >
          <div className="w-full px-1">{children}</div>
        </div>

        {imageSrc && (
          <div className="hidden md:flex items-center justify-center h-full">
            <div className="w-full aspect-[620/740] rounded-[24px] overflow-hidden">
              <img
                src={imageSrc}
                alt="Onboarding illustration"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default OnboardingLayout;
