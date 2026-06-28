const UpcomingExamCard = () => {
  return (
    <div className="text-black p-2 flex flex-row items-center justify-between bg-white border border-b border-gray-300 rounded-sm hover:bg-[#2DC653] cursor-pointer hover:text-white">
      <div className="">
        <h3 className="font-bold text-base">Agriculture 1</h3>
        <h5 className="font-semibold text-sm">Unit Test</h5>
        <p className="text-xs">Topics: Horticulture, Agronomy</p>
      </div>

      <div className="flex flex-col">
        <p className="text-xs">July 06, 2026</p>
        <p className="text-xs">10:00 AM - 01:00 PM</p>
      </div>
    </div>
  )
}

export { UpcomingExamCard }
