import "./App.css";
import { useRef, useEffect, useState, useImperativeHandle, forwardRef } from "react";
// import debounce from 'lodash.debounce'
import throttle from 'lodash.throttle'
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
  UndoButton,
  RedoButton,
} from "./Buttons";
import { insertImages, loadInlineImage } from "./ImageUpload/utils";
// importing the plugin js.
// import 'tinymce/plugins/advlist';
// import 'tinymce/plugins/autolink';
// import 'tinymce/plugins/link';
import "tinymce/plugins/paste";
// import 'tinymce/plugins/image';
import "tinymce/plugins/lists";
import "tinymce/plugins/autoresize";
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
import contentStyle from "!!raw-loader!./contentStyle.css";

function App({
  disabled = false,
  autoFocus = true,
  onChange,
  defaultValue = "",
}, ref) {
  const rootRef = useRef();
  const [editor, setEditor] = useState(null);
  const htmlRef = useRef(defaultValue)
  const linkDialogRef = useRef();

  
  useEffect(() => {
    tinymce
      .init({
        readonly: disabled,
        target: rootRef.current,
        plugins: "lists autoresize spellchecker_onmail paste",
        init_instance_callback: (editor) => {
          console.log("init instance callback");
          editor.setContent(defaultValue);

          // TODO: parse the default value first before setting content
          loadInlineImage(editor);
          editor.undoManager.clear();
          editor.undoManager.add();
          editor.setDirty(false);
          editor.setMode(disabled ? "readonly" : "design");
          autoFocus && editor.focus();

          setEditor(editor);

          // paste event
          editor.on("paste", function (event) {
            event.preventDefault();
            console.log("paste event is fired");
            let files = (event.clipboardData || window.clipboardData).files;
            if (files.length === 0) {
              console.log("no files");
              return;
            }
            insertImages(editor, files);
          });
          
          
            editor.execCommand('mceSpellCheck')
          

          

          editor.on('click', () => editor.fire('contextmenu'))

          editor.on('NodeChange change input compositionend setcontent', () => {
            const newContent = editor.getContent()
            if (htmlRef.current !== newContent) {
            
              htmlRef.current = newContent
              onChange && onChange(newContent)
            }

          

          })
          editor.on('change input compositionend setcontent undo', throttle(() => {
            editor.execCommand('mceSpellCheck')

          }, 2000))

          editor.on('input', () => {
            if (editor.selection.isCollapsed()) {
              
              const parent = editor.dom.getParents(editor.selection.getNode()).find(item => {
                return item.matches && item.matches('.mce-spellchecker-grammar, .mce-spellchecker-word')
              })
              if (parent) {
                editor.dom.remove(parent, true)
              }
   
             
              // if (commonAncestorContainer.matches && commonAncestorContainer.matches('.mce-spellchecker-grammar, .mce-spellchecker-word')) {
              //   editor.dom.remove(commonAncestorContainer, true);
              // }

            }
          })
          
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
        },

        branding: false,
        contextmenu: 'spellchecker',
        custom_ui_selector: ".custom-inline-strong",
        elementpath: false,
        min_height: 300,

        icons: "",
        preview_styles: false,
        menubar: false,
        toolbar: false,
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
          //  bold: {inline: "b"},
          // italic: { inline: 'i' },
          // underline: { inline: 'u'},
          // strikethrough: { inline: 'strike' },
        },

        browser_spellcheck: false,

        block_unsupported_drop: false,
        images_reuse_filename: true,
        autoresize_bottom_margin: 0,
        object_resizing: "img",

        spellchecker_on_load: true,
        spellchecker_callback: (method, text, success, failure) => {
          if (method === 'spellcheck') {
            fetch('http://localhost:8000/spellchecker', {
              method: 'POST',
              headers: {
                'content-type': 'application/json'
              },
              body: JSON.stringify({
                texts: [text],
                whitelist: []
              })
            }).then(res => res.json()).then(result => {
              success(result)
            }).catch(e => {
              failure("Spellcheck error:" + e);
            })
            
          } else {
            failure('Unsupported spellcheck method');
          }
        },
        spellchecker_rpc_url: 'http://localhost:8000/spellchecker',


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
    <div style={{ position: 'flex',  }}>
    <EditorContext.Provider value={editor}>
      {!!editor && (
        <>
          <div className="custom-inline-strong">
            <UndoButton />
            <RedoButton />
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
     
    </div>
  );
}

export default forwardRef(App);
