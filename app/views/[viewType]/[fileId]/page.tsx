import { ViewRouter } from "@/components/views/view-router";

type ViewPageProps = {
  params: Promise<{
    viewType: string;
    fileId: string;
  }>;
};

export default async function ViewPage({ params }: ViewPageProps) {
  const { viewType: rawViewType, fileId: rawFileId } = await params;
  const viewType = decodeURIComponent(rawViewType);
  const fileId = decodeURIComponent(rawFileId);

  return <ViewRouter viewType={viewType} fileId={fileId} />;
}
