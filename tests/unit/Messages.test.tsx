import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import Messages from "../../src/components/Messages";
import type { Message } from "ai";
import type { Reference } from "../../src/lib/rag/types";

// Extended message type with optional references
interface MessageWithReferences extends Message {
  references?: Reference[];
}

describe("Messages component", () => {
  // Step 1: Tests for existing functionality

  it("renders user messages with user icon", () => {
    const messages: Message[] = [
      { id: "1", role: "user", content: "Hello there!" },
    ];

    render(<Messages messages={messages} />);

    expect(screen.getByText("Hello there!")).toBeInTheDocument();
    expect(screen.getByText("🧑‍💻")).toBeInTheDocument();
  });

  it("renders assistant messages with robot icon", () => {
    const messages: Message[] = [
      { id: "1", role: "assistant", content: "Hi! How can I help?" },
    ];

    render(<Messages messages={messages} />);

    expect(screen.getByText("Hi! How can I help?")).toBeInTheDocument();
    expect(screen.getByText("🤖")).toBeInTheDocument();
  });

  it("renders multiple messages in order", () => {
    const messages: Message[] = [
      { id: "1", role: "user", content: "First message" },
      { id: "2", role: "assistant", content: "Second message" },
      { id: "3", role: "user", content: "Third message" },
    ];

    render(<Messages messages={messages} />);

    expect(screen.getByText("First message")).toBeInTheDocument();
    expect(screen.getByText("Second message")).toBeInTheDocument();
    expect(screen.getByText("Third message")).toBeInTheDocument();
  });

  it("renders markdown content", () => {
    const messages: Message[] = [
      { id: "1", role: "assistant", content: "Here is **bold** text" },
    ];

    render(<Messages messages={messages} />);

    // ReactMarkdown renders **bold** as <strong>
    const boldElement = screen.getByText("bold");
    expect(boldElement.tagName).toBe("STRONG");
  });

  it("renders empty messages array without error", () => {
    render(<Messages messages={[]} />);

    // Should render container without messages
    const container = document.querySelector(".space-y-4");
    expect(container).toBeInTheDocument();
  });

  // Step 2: Tests for References functionality (should fail initially)

  describe("with References", () => {
    it("renders References toggle below assistant message when references exist", () => {
      const messages: MessageWithReferences[] = [
        {
          id: "1",
          role: "assistant",
          content: "The heart has four chambers.",
          references: [
            {
              documentName: "anatomy.pdf",
              pageNumber: 10,
              snippet: "The heart has four chambers: two atria and two ventricles.",
            },
          ],
        },
      ];

      render(<Messages messages={messages} />);

      expect(screen.getByText(/The heart has four chambers/)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /source/i })).toBeInTheDocument();
    });

    it("does not render References section when assistant message has no references", () => {
      const messages: MessageWithReferences[] = [
        { id: "1", role: "assistant", content: "Hello! How can I help?" },
      ];

      render(<Messages messages={messages} />);

      expect(screen.getByText(/Hello! How can I help?/)).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /source/i })).not.toBeInTheDocument();
    });

    it("does not render References section when references array is empty", () => {
      const messages: MessageWithReferences[] = [
        { id: "1", role: "assistant", content: "No references.", references: [] },
      ];

      render(<Messages messages={messages} />);

      expect(screen.queryByRole("button", { name: /source/i })).not.toBeInTheDocument();
    });

    it("shows References collapsed by default with source count", () => {
      const messages: MessageWithReferences[] = [
        {
          id: "1",
          role: "assistant",
          content: "Here is the information.",
          references: [
            { documentName: "doc1.pdf", pageNumber: 1, snippet: "Content 1" },
            { documentName: "doc2.pdf", pageNumber: 5, snippet: "Content 2" },
            { documentName: "doc3.pdf", pageNumber: 10, snippet: "Content 3" },
          ],
        },
      ];

      render(<Messages messages={messages} />);

      const toggle = screen.getByRole("button", { name: /3 sources/i });
      expect(toggle).toBeInTheDocument();

      // Snippets should not be visible when collapsed
      expect(screen.queryByText("Content 1")).not.toBeInTheDocument();
    });

    it("expands to show references when toggle is clicked", () => {
      const messages: MessageWithReferences[] = [
        {
          id: "1",
          role: "assistant",
          content: "Here is the information.",
          references: [
            {
              documentName: "anatomy.pdf",
              pageNumber: 15,
              snippet: "The detailed anatomy content.",
            },
          ],
        },
      ];

      render(<Messages messages={messages} />);

      fireEvent.click(screen.getByRole("button", { name: /1 source/i }));

      expect(screen.getByText(/anatomy.pdf/)).toBeInTheDocument();
      expect(screen.getByText(/Page 15/)).toBeInTheDocument();
    });

    it("shows snippet when reference is clicked", () => {
      const messages: MessageWithReferences[] = [
        {
          id: "1",
          role: "assistant",
          content: "Here is the information.",
          references: [
            {
              documentName: "anatomy.pdf",
              pageNumber: 15,
              snippet: "The detailed anatomy content.",
            },
          ],
        },
      ];

      render(<Messages messages={messages} />);

      fireEvent.click(screen.getByRole("button", { name: /1 source/i }));
      fireEvent.click(screen.getByRole("button", { name: /anatomy.pdf/i }));

      expect(screen.getByText("The detailed anatomy content.")).toBeInTheDocument();
    });

    it("displays line range when available instead of page number", () => {
      const messages: MessageWithReferences[] = [
        {
          id: "1",
          role: "assistant",
          content: "Here is the information.",
          references: [
            {
              documentName: "notes.txt",
              lineStart: 10,
              lineEnd: 25,
              snippet: "Text file content.",
            },
          ],
        },
      ];

      render(<Messages messages={messages} />);

      fireEvent.click(screen.getByRole("button", { name: /1 source/i }));

      expect(screen.getByText(/Lines 10-25/)).toBeInTheDocument();
    });

    it("renders independent References sections for multiple assistant messages", () => {
      const messages: MessageWithReferences[] = [
        {
          id: "1",
          role: "assistant",
          content: "First answer.",
          references: [{ documentName: "doc1.pdf", pageNumber: 1, snippet: "Snippet 1" }],
        },
        { id: "2", role: "user", content: "Another question" },
        {
          id: "3",
          role: "assistant",
          content: "Second answer.",
          references: [
            { documentName: "doc2.pdf", pageNumber: 5, snippet: "Snippet 2" },
            { documentName: "doc3.pdf", pageNumber: 10, snippet: "Snippet 3" },
          ],
        },
      ];

      render(<Messages messages={messages} />);

      const toggles = screen.getAllByRole("button", { name: /source/i });
      expect(toggles).toHaveLength(2);
      expect(toggles[0]).toHaveTextContent(/1 source/i);
      expect(toggles[1]).toHaveTextContent(/2 sources/i);
    });
  });
});
