'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Superscript from '@tiptap/extension-superscript';
import Subscript from '@tiptap/extension-subscript';
import TextAlign from '@tiptap/extension-text-align';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import ImageExtension from '@tiptap/extension-image';
import LinkExtension from '@tiptap/extension-link';

import {
  Bold,
  Italic,
  Strikethrough,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Superscript as SuperscriptIcon,
  Subscript as SubscriptIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Paintbrush,
  Eraser,
  ImageIcon,
  Table as TableIcon,
  Plus,
  Trash2,
  MoreHorizontal,
  Undo,
  Redo,
  Loader2,
  Check,
  Unlink
} from 'lucide-react';

import { Toggle } from '@/components/ui/toggle';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useCallback, useRef, useState } from 'react';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

interface EditorProps {
  content: string;
  onChange: (content: string) => void;
  className?: string;
}

const colors = [
  '#000000', '#4b5563', '#dc2626', '#d97706', '#059669', '#2563eb', '#7c3aed', '#db2777'
];

export function Editor({ content, onChange, className }: EditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        bulletList: {
          keepMarks: true,
          keepAttributes: false, 
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Underline,
      Superscript,
      Subscript,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      ImageExtension.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          class: 'rounded-lg border shadow-sm max-w-full h-auto my-4',
        },
      }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline underline-offset-4 cursor-pointer',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
            class: 'border-collapse table-auto w-full my-4',
        }
      }),
      TableRow,
      TableHeader,
      TableCell.configure({
        HTMLAttributes: {
            class: 'border p-2 relative',
        }
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class:
          'prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-2xl focus:outline-none min-h-[300px] p-4 max-w-none',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    immediatelyRender: false,
  });

  const handleImageUpload = useCallback(async (file: File) => {
    if (!editor) return;
    setIsUploading(true);
    const storage = getStorage();
    const fileId = `${uuidv4()}-${file.name}`;
    const storageRef = ref(storage, `blog-content/${fileId}`);
    try {
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      editor.chain().focus().setImage({ src: downloadURL }).run();
    } catch (error) {
      console.error('Error uploading image: ', error);
    } finally {
      setIsUploading(false);
    }
  }, [editor]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
    if (event.target) {
        event.target.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const setLink = useCallback(() => {
    if (!editor) return;
    
    if (editor.isActive('link')) {
        editor.chain().focus().unsetLink().run();
        return;
    }

    const previousUrl = editor.getAttributes('link').href;
    setLinkUrl(previousUrl || '');
  }, [editor]);

  const applyLink = () => {
      if(linkUrl) {
          editor?.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
          setLinkUrl('');
      }
  }

  if (!editor) {
    return null;
  }

  return (
    <div className={`flex flex-col border rounded-md bg-background ${className || ''}`}>
      {/* --- Main Toolbar --- */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/30 sticky top-0 z-10 backdrop-blur-sm">
        
        {/* Text Style Group */}
        <div className="flex items-center gap-0.5">
            <Toggle size="sm" pressed={editor.isActive('bold')} onPressedChange={() => editor.chain().focus().toggleBold().run()} aria-label="Bold">
                <Bold className="h-4 w-4" />
            </Toggle>
            <Toggle size="sm" pressed={editor.isActive('italic')} onPressedChange={() => editor.chain().focus().toggleItalic().run()} aria-label="Italic">
                <Italic className="h-4 w-4" />
            </Toggle>
            <Toggle size="sm" pressed={editor.isActive('underline')} onPressedChange={() => editor.chain().focus().toggleUnderline().run()} aria-label="Underline">
                <UnderlineIcon className="h-4 w-4" />
            </Toggle>
            <Toggle size="sm" pressed={editor.isActive('strike')} onPressedChange={() => editor.chain().focus().toggleStrike().run()} aria-label="Strikethrough">
                <Strikethrough className="h-4 w-4" />
            </Toggle>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Headings */}
        <div className="flex items-center gap-0.5">
            <Toggle size="sm" pressed={editor.isActive('heading', { level: 1 })} onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} aria-label="H1">
                <Heading1 className="h-4 w-4" />
            </Toggle>
            <Toggle size="sm" pressed={editor.isActive('heading', { level: 2 })} onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} aria-label="H2">
                <Heading2 className="h-4 w-4" />
            </Toggle>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Alignment */}
        <div className="flex items-center gap-0.5">
            <Toggle size="sm" pressed={editor.isActive({ textAlign: 'left' })} onPressedChange={() => editor.chain().focus().setTextAlign('left').run()} aria-label="Align Left">
                <AlignLeft className="h-4 w-4" />
            </Toggle>
            <Toggle size="sm" pressed={editor.isActive({ textAlign: 'center' })} onPressedChange={() => editor.chain().focus().setTextAlign('center').run()} aria-label="Align Center">
                <AlignCenter className="h-4 w-4" />
            </Toggle>
            <Toggle size="sm" pressed={editor.isActive({ textAlign: 'right' })} onPressedChange={() => editor.chain().focus().setTextAlign('right').run()} aria-label="Align Right">
                <AlignRight className="h-4 w-4" />
            </Toggle>
        </div>
        
        <Separator orientation="vertical" className="h-6 mx-1" />

         {/* Lists */}
         <div className="flex items-center gap-0.5">
            <Toggle size="sm" pressed={editor.isActive('bulletList')} onPressedChange={() => editor.chain().focus().toggleBulletList().run()} aria-label="Bullet List">
                <List className="h-4 w-4" />
            </Toggle>
            <Toggle size="sm" pressed={editor.isActive('orderedList')} onPressedChange={() => editor.chain().focus().toggleOrderedList().run()} aria-label="Ordered List">
                <ListOrdered className="h-4 w-4" />
            </Toggle>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Insert Group */}
        <div className="flex items-center gap-0.5">
            {/* Link Popover */}
            <Popover>
                <PopoverTrigger asChild>
                    <Toggle size="sm" pressed={editor.isActive('link')} aria-label="Link">
                        <LinkIcon className="h-4 w-4" />
                    </Toggle>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="start">
                    <div className="flex flex-col gap-2">
                        <Label>URL посилання</Label>
                        <div className="flex gap-2">
                            <Input 
                                value={linkUrl} 
                                onChange={(e) => setLinkUrl(e.target.value)} 
                                placeholder="https://example.com"
                                onKeyDown={(e) => { if(e.key === 'Enter') applyLink() }}
                            />
                            <Button size="icon" onClick={applyLink}><Check className="h-4 w-4" /></Button>
                        </div>
                        {editor.isActive('link') && (
                            <Button variant="ghost" size="sm" onClick={() => editor.chain().focus().unsetLink().run()} className="justify-start px-0 text-destructive hover:text-destructive">
                                <Unlink className="mr-2 h-4 w-4" /> Видалити посилання
                            </Button>
                        )}
                    </div>
                </PopoverContent>
            </Popover>

            <Button size="sm" variant="ghost" onClick={triggerFileInput} disabled={isUploading} className="px-2" title="Вставити фото">
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
            </Button>
            
            <Toggle size="sm" pressed={editor.isActive('blockquote')} onPressedChange={() => editor.chain().focus().toggleBlockquote().run()} aria-label="Quote">
                <Quote className="h-4 w-4" />
            </Toggle>

             {/* Color Picker Popover */}
            <Popover>
                <PopoverTrigger asChild>
                    <Button size="sm" variant="ghost" className="px-2" title="Колір тексту">
                        <Paintbrush className="h-4 w-4" style={{ color: editor.getAttributes('textStyle').color }}/>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2" align="center">
                    <div className="flex gap-1 flex-wrap w-32">
                        {colors.map(color => (
                            <button
                                key={color}
                                onClick={() => editor.chain().focus().setColor(color).run()}
                                className={`w-6 h-6 rounded-full border border-gray-200 hover:scale-110 transition-transform ${editor.isActive('textStyle', { color }) ? 'ring-2 ring-primary ring-offset-1' : ''}`}
                                style={{ backgroundColor: color }}
                                title={color}
                            />
                        ))}
                        <button 
                             onClick={() => editor.chain().focus().unsetColor().run()}
                             className="w-6 h-6 rounded-full border bg-transparent flex items-center justify-center text-xs text-muted-foreground hover:bg-muted"
                             title="Скинути колір"
                        >
                            <Eraser className="h-3 w-3" />
                        </button>
                    </div>
                </PopoverContent>
            </Popover>
        </div>

        <div className="flex-grow" />

        {/* More Options Dropdown */}
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="px-2">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                        <TableIcon className="mr-2 h-4 w-4" /> Таблиця
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="w-48">
                        <DropdownMenuItem onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
                            <Plus className="mr-2 h-4 w-4" /> Створити 3x3
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => editor.chain().focus().addColumnBefore().run()}>Додати стовпець зліва</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => editor.chain().focus().addColumnAfter().run()}>Додати стовпець справа</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => editor.chain().focus().deleteColumn().run()} className="text-destructive">Видалити стовпець</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => editor.chain().focus().addRowBefore().run()}>Додати рядок вище</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => editor.chain().focus().addRowAfter().run()}>Додати рядок нижче</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => editor.chain().focus().deleteRow().run()} className="text-destructive">Видалити рядок</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => editor.chain().focus().deleteTable().run()} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Видалити таблицю
                        </DropdownMenuItem>
                    </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
                    <Code className="mr-2 h-4 w-4" /> Код
                </DropdownMenuItem>
                 <DropdownMenuItem onClick={() => editor.chain().focus().toggleSuperscript().run()}>
                    <SuperscriptIcon className="mr-2 h-4 w-4" /> Верхній індекс
                </DropdownMenuItem>
                 <DropdownMenuItem onClick={() => editor.chain().focus().toggleSubscript().run()}>
                    <SubscriptIcon className="mr-2 h-4 w-4" /> Нижній індекс
                </DropdownMenuItem>
                
                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={() => editor.chain().focus().unsetAllMarks().run()}>
                    <Eraser className="mr-2 h-4 w-4" /> Очистити форматування
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="h-6 mx-1" />

         <div className="flex items-center gap-0.5">
            <Button size="sm" variant="ghost" onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className="px-2" aria-label="Undo">
                <Undo className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className="px-2" aria-label="Redo">
                <Redo className="h-4 w-4" />
            </Button>
        </div>
      </div>

      {/* --- Editor Content --- */}
      <div className="relative min-h-[400px]">
        <EditorContent editor={editor} />
      </div>

      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />
    </div>
  );
}
