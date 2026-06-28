import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

const KEY_VERSIONS = ["A", "B"] 

const ANSWER_CHOICES = ["A", "B", "C", "D", "E"]

const ActualAnswer = ({ questionNumber }: { questionNumber: number }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 border-2 border-[#E6E6E7] p-2">
    {/* Question number */}
    <div className="flex items-center gap-x-2 justify-center">
      <p className="text-sm">{questionNumber}. Correct Answer:</p>
      <div className="grid grid-cols-5 gap-x-2">
        {ANSWER_CHOICES.map((choice, index) => (
          <Button key={index} variant="outline" className="rounded-full cursor-pointer w-10 h-10">
            {choice}
          </Button>
        ))}
      </div>
    </div>
  </div>
)


const ActualAnswerEditor = () => {
  return (
    <div className="flex p-4 md:p-6 lg:p-8">
      <div className="flex flex-col gap-y-6 w-full">
        {/* Page header */}
        <div className="flex flex-col">
          <h1 className="text-2xl lg:text-3xl font-bold text-[#262626]">Answer Key Editor</h1>
          <p className="text-[#6E6E6E] text-sm lg:text-base">Create and manage answer keys for exams</p>
        </div>

        <Separator className="w-full h-2 bg-[#F2F2F2] border-t-2" />

        <div className="flex flex-row items-center gap-x-2">
          <p className="font-semibold">Key Versions:</p>
          <Select defaultValue={KEY_VERSIONS[0]}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Key Version" />
            </SelectTrigger>
            <SelectContent>
              {KEY_VERSIONS.map((key) => (
                <SelectItem key={key} value={key}>
                  {key}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Answer key section */}
        <div className="flex flex-col gap-5">
          {Array.from({ length: 100 }, (_, index) => (
            <ActualAnswer key={index} questionNumber={index + 1} />
          ))}
        </div>
      </div>
    </div>
  )
}

export { ActualAnswerEditor }