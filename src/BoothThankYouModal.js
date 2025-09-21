import React from "react";
import { Star, Heart, Wine, Sparkles } from "lucide-react";

const BoothThankYouModal = ({
  isOpen = true,
  boothCustomization = {
    icon: "🍷",
    title: "Welcome to our Wine Tasting!",
    subtitle: "Enter your email to start rating wines",
    buttonText: "Start Tasting",
    backgroundColor: "#047857",
    textColor: "#ffffff",
    logoUrl: null,
    useCustomLogo: false,
  },
  userEmail = "demo@example.com",
  totalWinesRated = 6,
  onClose = () => console.log("Modal closed"),
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Modal backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal content */}
      <div
        className="relative bg-white/10 backdrop-blur-md p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white/20"
        style={{ backgroundColor: `${boothCustomization.backgroundColor}CC` }} // Adding some transparency
      >
        <div className="text-center">
          {/* Success Icon Animation */}
          <div className="relative mb-6">
            {/* Floating sparkles animation */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles
                size={24}
                className="text-white/60 animate-pulse absolute -top-2 -right-2"
                style={{ animationDelay: "0s" }}
              />
              <Sparkles
                size={16}
                className="text-white/40 animate-pulse absolute -bottom-1 -left-1"
                style={{ animationDelay: "0.5s" }}
              />
              <Sparkles
                size={20}
                className="text-white/50 animate-pulse absolute top-1 left-2"
                style={{ animationDelay: "1s" }}
              />
            </div>

            {/* Main icon with gentle bounce */}
            <div className="relative z-10">
              {boothCustomization.useCustomLogo &&
              boothCustomization.logoUrl ? (
                <img
                  src={boothCustomization.logoUrl}
                  alt="Event logo"
                  className="w-20 h-20 mx-auto object-contain bg-white/10 rounded-lg p-3 animate-bounce"
                  style={{ animationDuration: "2s" }}
                />
              ) : (
                <div
                  className="text-7xl mb-2 animate-bounce inline-block"
                  style={{ animationDuration: "2s" }}
                >
                  {boothCustomization.icon}
                </div>
              )}
            </div>
          </div>

          {/* Thank you message */}
          <div className="mb-8">
            <h1
              className="text-2xl font-bold mb-3"
              style={{ color: boothCustomization.textColor }}
            >
              Thank You!
            </h1>
            <p
              className="text-base opacity-90 mb-4"
              style={{ color: boothCustomization.textColor }}
            >
              We appreciate you taking the time to rate all {totalWinesRated}{" "}
              wines in our tasting.
            </p>
            <p
              className="text-sm opacity-75"
              style={{ color: boothCustomization.textColor }}
            >
              Don't forget your free wine stopper when you purchase a sparkling
              wine.
            </p>
          </div>

          {/* Rating summary with animated stars */}
          <div className="mb-8">
            <div className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg p-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={20}
                    className="text-yellow-300 fill-yellow-300 animate-pulse"
                    style={{ animationDelay: `${star * 0.1}s` }}
                  />
                ))}
              </div>
              <p
                className="text-sm font-medium"
                style={{ color: boothCustomization.textColor }}
              >
                {totalWinesRated} wines rated
              </p>
              <p
                className="text-xs opacity-75 mt-1"
                style={{ color: boothCustomization.textColor }}
              >
                Saved to {userEmail}
              </p>
            </div>
          </div>

          {/* Looking forward message */}
          <div className="mb-8">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Heart
                size={20}
                className="text-red-300 fill-red-300 animate-pulse"
              />
              <Wine
                size={20}
                className="text-white/80 animate-pulse"
                style={{ animationDelay: "0.5s" }}
              />
              <Heart
                size={20}
                className="text-red-300 fill-red-300 animate-pulse"
                style={{ animationDelay: "1s" }}
              />
            </div>
            <p
              className="text-base font-medium mb-2"
              style={{ color: boothCustomization.textColor }}
            >
              <a
                href="https://drinksonmeliquors.com/collections/loveluvv"
                target="_blank"
                rel="noopener noreferrer"
              >
                Visit our products on the Clinkfest website.
              </a>
            </p>
            <p
              className="text-sm opacity-80"
              style={{ color: boothCustomization.textColor }}
            >
              <a
                href="https://drinksonmeliquors.com/collections/loveluvv"
                target="_blank"
                rel="noopener noreferrer"
              >
                Click here to purchase our products.
              </a>
            </p>
          </div>

          {/* Optional action button */}
          <div className="space-y-3">
            <button
              onClick={() =>
                window.open("https://loveluvvsparkling.wine", "_blank")
              }
              className="w-full bg-white/20 backdrop-blur-sm border border-white/30 px-6 py-3 rounded-lg font-semibold hover:bg-white/30 transition-all duration-200 transform hover:scale-105"
              style={{ color: boothCustomization.textColor }}
            >
              Learn More About our Wines
            </button>

            <p
              className="text-xs opacity-60 mt-4"
              style={{ color: boothCustomization.textColor }}
            >
              Thank you for participating in our wine tasting experience
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoothThankYouModal;
