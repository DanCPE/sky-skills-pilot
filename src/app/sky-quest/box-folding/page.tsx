import TopicLayout from "@/components/TopicLayout";

export default function BoxFoldingPage() {
  return (
    <TopicLayout
      title="Box Folding"
      description="Visualize how 2D nets fold into 3D shapes."
    >
      <div className="flex min-h-[300px] items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
        <p className="text-sm text-zinc-400 dark:text-zinc-600">Exercises coming soon</p>
      </div>
    </TopicLayout>
  );
}
