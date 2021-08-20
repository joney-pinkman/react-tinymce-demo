import "./App.css";
import { useRef, useEffect, useState } from "react";
import LinkDialog from "./LinkDialog";
import tinymce from "tinymce/tinymce";
import { EditorContext } from "./EditorContext";
import "tinymce/themes/silver";
// Toolbar icons
import "tinymce/icons/default";
// // Editor styles
import "tinymce/skins/ui/oxide/skin.min.css";
import {
  BoldButton,
  ItalicButton,
  UnderlineButton,
  StrikethroughButton,
  RedColorButton,
  BlueColorButton,
  HighlightButton,
  SmallSizeButton,
  LargeSizeButton,
  RemoveFormatButton,
  BulletListButton,
  OrderListButton,
  IndentMoreButton,
  IndentLessButton,
  InsertLinkButton,
  InsertImageButton,
} from "./Buttons";
import { useLazyLoad } from "./ImageUpload/useLazyLoad";
// importing the plugin js.
// import 'tinymce/plugins/advlist';
// import 'tinymce/plugins/autolink';
// import 'tinymce/plugins/link';
// import "tinymce/plugins/paste";
// import 'tinymce/plugins/image';
import "tinymce/plugins/lists";
// import "tinymce/plugins/autoresize";
// import 'tinymce/plugins/charmap';
// import 'tinymce/plugins/hr';
// import 'tinymce/plugins/anchor';
// import 'tinymce/plugins/spellchecker';
// import 'tinymce/plugins/searchreplace';
// import 'tinymce/plugins/wordcount';
// import 'tinymce/plugins/code';
// import 'tinymce/plugins/fullscreen';
// import 'tinymce/plugins/insertdatetime';
// import 'tinymce/plugins/media';
// import 'tinymce/plugins/nonbreaking';
// import 'tinymce/plugins/table';
// import 'tinymce/plugins/template';
// import 'tinymce/plugins/help';

/* eslint import/no-webpack-loader-syntax: off */
// import contentCss from '!!raw-loader!tinymce/skins/content/default/content.min.css';
// import contentUiCss from '!!raw-loader!tinymce/skins/ui/oxide/content.min.css';
import "./plugins/spellchecker";
import "./plugins/paste";
import contentStyle from "!!raw-loader!./contentStyle.css";

function App({
  disabled = false,
  autoFocus = true,
  onChange,
  defaultValue = "",
}) {
  const rootRef = useRef();
  const [editor, setEditor] = useState(null);
  const linkDialogRef = useRef();
  useLazyLoad(editor, {});

  useEffect(() => {
    tinymce
      .init({
        readonly: disabled,
        target: rootRef.current,
        plugins: "lists spellchecker_onmail paste_onmail",
        init_instance_callback: (editor) => {
          console.log("init instance callback");
          editor.setContent(defaultValue);

          editor.undoManager.clear();
          editor.undoManager.add();
          editor.setDirty(false);
          editor.setMode(disabled ? "readonly" : "design");
          autoFocus && editor.focus();

          setEditor(editor);
        },
        setup: (editor) => {
          console.log("setup");
          editor.ui.registry.addButton("linkedit", {
            text: "edit link",
            onAction: () => {
              const linkNode = editor.dom
                .getParents(editor.selection.getNode())
                .find((node) => node.nodeName === "A");
              const linkContent = linkNode.text;
              const linkHref = linkNode.getAttribute("href");
              linkDialogRef.current.show(linkContent, linkHref);
            },
          });
          editor.ui.registry.addButton("linkopen", {
            text: "open link",
            onAction: () => {},
          });
          editor.ui.registry.addButton("linkremove", {
            text: "remove link",
            onAction: () => {},
          });

          var isLinkNode = function (link) {
            return editor.dom.is(link, "a") && editor.getBody().contains(link);
          };

          editor.ui.registry.addContextToolbar("table", {
            predicate: isLinkNode,
            items: "linkedit | linkopen | linkremove",
            scope: "node",
            position: "node",
          });

          // Keyboard shortcuts
          editor.addShortcut("meta+shift+X", "Strikethrough", function () {
            editor.execCommand("Strikethrough");
          });

          editor.addShortcut("meta+k", "Insert link", function () {
            linkDialogRef.current.show();
          });

          editor.addShortcut("meta+shift+7", "Numbered List", function () {
            const selection = editor.dom.getParents(editor.selection.getNode());
            const isNumberedList = selection.some((node) => node === "li");
            if (isNumberedList) {
              editor.execCommand("RemoveList");
            } else {
              editor.execCommand("InsertOrderedList");
            }
          });

          editor.addShortcut("meta+shift+8", "Bulleted List", function () {
            const selection = editor.dom.getParents(editor.selection.getNode());
            const isNumberedList = selection.some((node) => node === "ol");
            if (isNumberedList) {
              editor.execCommand("RemoveList");
            } else {
              editor.execCommand("InsertUnorderedList");
            }
          });

          editor.addShortcut("meta+shift+L", "Align left", function () {
            editor.execCommand("JustifyLeft");
          });

          editor.addShortcut("meta+shift+R", "Align right", function () {
            editor.execCommand("JustifyRight");
          });

          editor.addShortcut("meta+shift+E", "Align center", function () {
            editor.execCommand("JustifyCenter");
          });

          editor.on("keydown", (event) => {
            // Does not work with add shortcut api
            if (event.metaKey && event.key === "\\") {
              event.preventDefault();
              editor.execCommand("RemoveFormat");
            }

            if (event.metaKey && event.key === "[") {
              event.preventDefault();
              editor.execCommand("Outdent");
            }

            if (event.metaKey && event.key === "]") {
              event.preventDefault();
              editor.execCommand("Indent");
            }

            if (event.metaKey && event.shiftKey && event.keyCode === 187) {
              event.preventDefault();
              editor.formatter.toggle("fontsize", { value: "large" });
            }

            if (event.metaKey && event.shiftKey && event.keyCode === 189) {
              event.preventDefault();
              editor.formatter.toggle("fontsize", { value: "x-small" });
            }
          });
        },

        branding: false,
        contextmenu: false,
        custom_ui_selector: ".custom-inline-strong",
        elementpath: false,
        // TODO: temp fix
        height: 5000,

        icons: "",
        preview_styles: false,
        menubar: false,
        toolbar: "spellchecker",
        placeholder: "this is a placeholder",
        resize: true,
        skin: false,
        statusbar: false,

        content_css: false,
        content_style: contentStyle,

        visual: false,

        convert_fonts_to_spans: false,
        element_format: "html",
        forced_root_block: "div",
        //if set false the space key will not work
        remove_trailing_brs: true,
        //the formats will change the format recognize
        formats: {
          ordered_list: { selector: "ol, li" },
          //  bold: {inline: "b"},
          // italic: { inline: 'i' },
          // underline: { inline: 'u'},
          // strikethrough: { inline: 'strike' },
        },

        browser_spellcheck: true,

        block_unsupported_drop: false,
        images_reuse_filename: true,
        autoresize_bottom_margin: 0,
        object_resizing: "img",
      })
      .then((editors) => {
        console.log("init complete");
      });
  }, []);

  useEffect(() => {
    return () => {
      editor && editor.destroy();
    };
  }, [editor]);

  return (
    <EditorContext.Provider value={editor}>
      {!!editor && (
        <>
          <div className="custom-inline-strong">
            <BoldButton />
            <ItalicButton />
            <UnderlineButton />
            <StrikethroughButton />
            <RedColorButton />
            <BlueColorButton />
            <HighlightButton />
            <SmallSizeButton />
            <LargeSizeButton />
            <RemoveFormatButton />
            <BulletListButton />
            <OrderListButton />
            <IndentMoreButton />
            <IndentLessButton />
            <InsertLinkButton onClick={() => linkDialogRef.current.show()} />
            <InsertImageButton />
          </div>
        </>
      )}
      <div ref={rootRef} />
      {!!editor && <LinkDialog ref={linkDialogRef} />}
    </EditorContext.Provider>
  );
}

export default App;
