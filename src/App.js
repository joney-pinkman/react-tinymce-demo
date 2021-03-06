import { useRef } from "react";
import Editor from "./Editor";
/* eslint import/no-webpack-loader-syntax: off */
import initialValue from "!!raw-loader!./test.html";
import { EDITOR_TYPES, IS_MAC } from "./constants";
import {
  uploadInlineImages,
  uploadBase64Images,
  loadExternalImage,
  loadInlineImage,
} from "./image/utils";
import { INLINE_IMG_ATTR, EXTERNAL_IMG_ATTR } from "./image/constants";
import { isLinkNode } from "./link/utils";

export const App = () => {
  const linkDialogRef = useRef();
  const enableImageBlobConversion = (img) => false;

  const handleShowLinkDialog = (editor) => {
    const isLinkedNode = isLinkNode(editor, editor.selection.getNode());
    if (isLinkedNode) {
      editor.execCommand("Unlink");
      return;
    }
    linkDialogRef.current.show();
  };

  const handlePaste = (event, editor) => {
    const files = event.clipboardData.files;
    if (files.length === 0) {
      return;
    }
    event.preventDefault();
    const images = [...files].filter((file) => file.type.includes("image"));
    if (images.length !== 0) {
      uploadInlineImages(editor, images);
    }
  };

  const handleUploadImage = (event, editor) => {
    if (!event.target.files.length) return;
    const files = event.target.files;
    const images = [...files].filter((file) => file.type.includes("image"));
    if (images.length !== 0) {
      uploadBase64Images(editor, images);
    }
  };

  const handleLoadImage = (node, type) => {
    if (type === INLINE_IMG_ATTR) {
      return loadInlineImage(node);
    } else if (type === EXTERNAL_IMG_ATTR) {
      return loadExternalImage(node);
    }
  };

  const handleKeyDown = (event, editor) => {
    const modKey = IS_MAC ? event.metaKey : event.ctrlKey;
    if (modKey && event.key === "k") {
      event.preventDefault();
      handleShowLinkDialog(editor);
    }
  };

  const handleDrop = (event, editor) => {
    const files = event.dataTransfer.files;

    if (files.length === 0) {
      return;
    }

    event.preventDefault();
    const images = [...files].filter((file) => file.type.includes("image"));
    if (images.length !== 0) {
      uploadInlineImages(editor, images);
    }
  };

  return (
    <Editor
      initialValue={initialValue}
      type={EDITOR_TYPES.signature}
      linkDialogRef={linkDialogRef}
      onKeyDown={handleKeyDown}
      options={{
        enableImageBlobConversion: enableImageBlobConversion,
        enableInsertImageButton: true,
        onShowLinkDialog: handleShowLinkDialog,
        onPaste: handlePaste,
        onUploadImage: handleUploadImage,
        onLoadImage: handleLoadImage,
        onDrop: handleDrop,
      }}
    />
  );
};
