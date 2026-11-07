import { CheckUnderstandingView } from "@/components/teach-back/CheckUnderstandingView";

/** Check My Understanding. Supports deep links: /check?questionId=<id>. */
export default async function CheckPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { questionId } = await searchParams;
  const initialQuestionId = typeof questionId === "string" ? questionId : undefined;
  return <CheckUnderstandingView initialQuestionId={initialQuestionId} />;
}
