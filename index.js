// dataleon-sdk.js

export class Dataleon {
  constructor({ sessionUrl, width = 400, height = 600, borderRadius = false }) {
    if (!sessionUrl) throw new Error("sessionUrl is required");

    this.sessionUrl = sessionUrl;
    this.width = width;
    this.height = height;
    this.borderRadius = borderRadius; // false by default, 10px if true
    this.iframe = null;
    this.modal = null;
    this.onResultCallback = null;
    this.handleMessage = this.handleMessage.bind(this);
  }

  /**
   * Set the result callback (FINISHED, FAILED, ABORTED)
   */
  onResult(callback) {
    this.onResultCallback = callback;
  }

  /**
   * Open the modal with the iframe
   */
  openModal() {
    // Create overlay
    this.modal = document.createElement("div");
    this.modal.style.position = "fixed";
    this.modal.style.top = "0";
    this.modal.style.left = "0";
    this.modal.style.width = "100vw";
    this.modal.style.height = "100vh";
    this.modal.style.background = "rgba(0,0,0,0.6)";
    this.modal.style.display = "flex";
    this.modal.style.alignItems = "center";
    this.modal.style.justifyContent = "center";
    this.modal.style.zIndex = "9999";

    // Add click event to overlay to close modal and trigger "CANCELED"
    this.modal.addEventListener("click", (e) => {
      // Only trigger if click is on the overlay, not on the iframe container or its children
      if (e.target === this.modal) {
        this.onResultCallback?.("CANCELED");
        this.closeModal();
      }
    });

    // Iframe container
    const iframeContainer = document.createElement("div");
    iframeContainer.style.width =
      typeof this.width === "string"
        ? this.width
        : `${this.width}px`;
    iframeContainer.style.height =
      typeof this.height === "string"
        ? this.height
        : `${this.height}px`;
    iframeContainer.style.background = "#fff"; // background is white
    if (this.borderRadius) {
      iframeContainer.style.borderRadius = "10px";
    }
    iframeContainer.style.overflow = "hidden";
    iframeContainer.style.boxShadow = "0 5px 20px rgba(0,0,0,0.2)";

    // Iframe
    this.iframe = document.createElement("iframe");
    this.iframe.src = this.sessionUrl;
    this.iframe.width = "100%";
    this.iframe.height = "100%";
    this.iframe.allow = "camera; microphone; autoplay";
    this.iframe.style.border = "none";

    iframeContainer.appendChild(this.iframe);
    this.modal.appendChild(iframeContainer);
    document.body.appendChild(this.modal);

    // Listen for messages
    window.addEventListener("message", this.handleMessage, false);
  }

  /**
   * Handle messages received from Dataleon
   */
  handleMessage(event) {
    const data = event.data;
    if (["FINISHED", "CANCELED"].includes(data)) {
      this.onResultCallback?.(data);
      this.closeModal();
    } else {
      this.onResultCallback?.(data);
    }
  }

  /**
   * Close and clean up the modal
   */
  closeModal() {
    window.removeEventListener("message", this.handleMessage);
    if (this.modal) {
      this.modal.remove();
      this.modal = null;
    }
    this.iframe = null;
  }
}
