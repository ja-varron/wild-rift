import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useIsMobile } from "@/hooks/use-mobile"

const Footer = () => {
  const isMobile = useIsMobile()

  return (
    <footer className="w-full bg-[#4A4A4A]">
      {isMobile ? (
        <div className="flex flex-col p-8 gap-4">
          {/* Download App Section */}
          <div className="flex flex-col items-center justify-center gap-4">
            <h3 className="text-white text-md text-center">Download Tuon Scanner App on Android and IOS</h3>
            <Button className="bg-[#2DC653] text-white font-semibold">
              Download Tuon Scanner App
            </Button>
          </div>

          {/* VSU Branding */}
          <div className="flex flex-col items-center justify-center">
            <h1 className="text-white text-2xl font-semibold text-center">VSU - University Review Services</h1>
          </div>
          <Separator /> 

          {/* Footer Links */}
          <div className="grid grid-cols-2 text-white justify-items-start gap-4">
            <div className="flex flex-col gap-2">
              <p>Terms and Conditions</p>
              <p>Data Protection</p>
            </div>
            <div className="flex flex-col gap-2">
              <p>Privacy Policy</p>
              <p>About Us</p>
            </div>
          </div>

          <Separator />

          {/* Bug Report */}
          <div className="flex flex-row gap-1 text-white">
            <p className="text-white">
              Software error/s or glitch/es? 
              <Button variant="link" className="underline md:underline-offset-2 text-[#2DC653] cursor-pointer">
                Report a bug
              </Button>
            </p>
          </div>

          {/* Copyright Info */}
          <p className="text-xs text-white text-center">© 2026 Tuon. All rights reserved.</p>
        </div>
      ) : (
        <div className="flex flex-col p-8 gap-4">
          {/* Download App Section */}
          <div className="flex flex-col items-center justify-center gap-4">
            <h3 className="text-white text-md text-center">Download Tuon Scanner App on Android and IOS</h3>
            <Button className="bg-[#2DC653] text-white font-semibold">
              Download Tuon Scanner App
            </Button>
          </div>

          {/* VSU Branding */}
          <div className="flex flex-col items-center justify-center">
            <h1 className="text-white text-2xl font-semibold text-center">VSU - University Review Services</h1>
          </div>
          <Separator /> 

          {/* Footer Links */}
          <div className="grid grid-cols-2 text-white justify-items-start gap-4">
            <div className="flex flex-col gap-2">
              <p>Terms and Conditions</p>
              <p>Data Protection</p>
            </div>
            <div className="flex flex-col gap-2">
              <p>Privacy Policy</p>
              <p>About Us</p>
            </div>
          </div>

          <Separator />

          {/* Bug Report */}
          <div className="flex flex-row gap-1 text-white">
            <p className="text-white">
              Software error/s or glitch/es? 
              <Button variant="link" className="underline md:underline-offset-2 text-[#2DC653] cursor-pointer">
                Report a bug
              </Button>
            </p>
          </div>

          {/* Copyright Info */}
          <p className="text-xs text-white text-center">© 2026 Tuon. All rights reserved.</p>
        </div>
      )}
    </footer>
  )
}

export { Footer }