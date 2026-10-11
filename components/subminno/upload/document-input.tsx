"use client";

import {
    ArrowRight,
    FileText,
    Loader2,
    UploadCloud,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
    ChangeEvent,
    DragEvent,
    useRef,
    useState,
} from "react";

import { getTextStats } from "@/lib/services/subminno/documents/text-stats";
import { calculatePrice } from "@/lib/services/subminno/pricing/calculate-price";
import type { PreparedDocument } from "@/lib/services/subminno/types";
import { useGuestDraft } from "@/components/subminno/providers/guest-draft-provider";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function DocumentInput() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [pasteText, setPasteText] = useState("");
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { setDraft } = useGuestDraft();

    async function processFile(file: File) {
        setError(null);

        if (file.size > MAX_FILE_SIZE) {
            setError("Maximum file size is 10 MB.");
            return;
        }

        const extension = file.name
            .split(".")
            .pop()
            ?.toLowerCase();

        if (
            !extension ||
            !["pdf", "docx", "txt"].includes(extension)
        ) {
            setError("Please upload a PDF, DOCX, or TXT file.");
            return;
        }

        setIsProcessing(true);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("/api/subminno/extract", {
                method: "POST",
                body: formData,
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || "Could not read this document."
                );
            }

            const id = crypto.randomUUID();

            const document: PreparedDocument = {
                id,
                source: "FILE",
                filename: result.filename,
                fileType: result.fileType,
                text: result.text,
                wordCount: result.wordCount,
                characterCount: result.characterCount,
                pricing: result.pricing,
                createdAt: new Date().toISOString(),
            };
            setDraft(document);
            router.push(`/subminno/check/${id}`);

            
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Something went wrong while processing the file."
            );
        } finally {
            setIsProcessing(false);
        }
    }

    function processPastedText() {
        setError(null);

        const {
            cleanedText,
            wordCount,
            characterCount,
        } = getTextStats(pasteText);

        if (wordCount < 20) {
            setError("Please enter at least 20 words.");
            return;
        }

        const id = crypto.randomUUID();

        const document: PreparedDocument = {
            id,
            source: "PASTE",
            filename: null,
            fileType: "text",
            text: cleanedText,
            wordCount,
            characterCount,
            pricing: calculatePrice(wordCount),
            createdAt: new Date().toISOString(),
        };

        setDraft(document);
        router.push(`/subminno/check/${id}`);
    }

    function handleFileChange(
        event: ChangeEvent<HTMLInputElement>
    ) {
        const file = event.target.files?.[0];

        if (file) {
            processFile(file);
        }

        event.target.value = "";
    }

    function handleDrop(
        event: DragEvent<HTMLDivElement>
    ) {
        event.preventDefault();
        setIsDragging(false);

        const file = event.dataTransfer.files?.[0];

        if (file) {
            processFile(file);
        }
    }

    const pasteWordCount =
        getTextStats(pasteText).wordCount;

    return (
        <div className="rounded-2xl border border-border bg-surface p-3 shadow-card sm:p-4">
            <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileChange}
                className="hidden"
            />

            <div
                onDragEnter={(event) => {
                    event.preventDefault();
                    setIsDragging(true);
                }}
                onDragOver={(event) => {
                    event.preventDefault();
                    setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`flex min-h-48 flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 text-center transition ${isDragging
                    ? "border-brand bg-blue-50"
                    : "border-border-strong bg-background"
                    }`}
            >
                {isProcessing ? (
                    <>
                        <Loader2 className="mb-4 size-8 animate-spin text-brand" />

                        <p className="text-sm font-semibold text-foreground">
                            Reading your document...
                        </p>

                        <p className="mt-2 text-xs text-secondary">
                            Extracting text and calculating length.
                        </p>
                    </>
                ) : (
                    <>
                        <div className="mb-4 flex size-11 items-center justify-center rounded-lg bg-blue-50 text-brand">
                            <UploadCloud className="size-5" />
                        </div>

                        <p className="text-sm font-semibold text-foreground">
                            Drop your PDF, DOCX or TXT here
                        </p>

                        <p className="mt-1 text-xs text-secondary">
                            or click to browse
                        </p>

                        <button
                            type="button"
                            onClick={() =>
                                fileInputRef.current?.click()
                            }
                            className="mt-5 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
                        >
                            Browse file
                        </button>
                    </>
                )}
            </div>

            <div className="my-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />

                <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
                    or
                </span>

                <div className="h-px flex-1 bg-border" />
            </div>

            <div className="relative">
                <textarea
                    value={pasteText}
                    onChange={(event) =>
                        setPasteText(event.target.value)
                    }
                    placeholder="Paste your text here..."
                    className="min-h-28 w-full resize-none rounded-xl border border-border bg-background px-4 py-3 pr-20 text-sm leading-6 text-foreground outline-none transition placeholder:text-muted focus:border-brand"
                />

                <span className="absolute bottom-3 right-3 rounded-md bg-surface px-2 py-1 text-[11px] font-medium text-secondary shadow-sm">
                    {pasteWordCount} words
                </span>
            </div>

            <button
                type="button"
                onClick={processPastedText}
                disabled={!pasteText.trim() || isProcessing}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
                Continue
                <ArrowRight className="size-4" />
            </button>

            <p className="mt-3 text-center text-[11px] leading-5 text-muted">
                Supports PDF, DOCX and TXT files. Maximum file size 10 MB.
            </p>

            {error && (
                <div className="mt-3 flex gap-3 rounded-lg bg-danger-soft p-3 text-sm text-danger">
                    <FileText className="mt-0.5 size-4 shrink-0" />

                    <p>{error}</p>
                </div>
            )}
        </div>
    );
}