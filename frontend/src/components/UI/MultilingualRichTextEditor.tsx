import React, { useState } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { useI18n } from '../../contexts/I18nProvider'

interface MultilingualRichTextEditorProps {
  label?: string
  value: {
    en: string
    ne: string
  }
  onChange: (value: { en: string; ne: string }) => void
  error?: {
    en?: string
    ne?: string
  }
  helpText?: string
  required?: boolean
  showLanguageIndicator?: boolean
  placeholder?: string
  minHeight?: string
}

export const MultilingualRichTextEditor: React.FC<MultilingualRichTextEditorProps> = ({
  label,
  value,
  onChange,
  error,
  helpText,
  required,
  showLanguageIndicator = true,
  placeholder = '',
  minHeight = '200px'
}) => {
  const { language } = useI18n()
  const [activeLanguage, setActiveLanguage] = useState<'en' | 'ne'>(language)

  const getLanguageLabel = (lang: 'en' | 'ne') => {
    return lang === 'en' ? 'English' : 'नेपाली'
  }

  const hasContent = (lang: 'en' | 'ne') => {
    return value[lang] && value[lang].trim().length > 0
  }

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        }
      }),
      Placeholder.configure({
        placeholder: `${placeholder} (${getLanguageLabel(activeLanguage)})`
      })
    ],
    content: value[activeLanguage],
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onChange({
        ...value,
        [activeLanguage]: html
      })
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none ${
          activeLanguage === 'ne' ? 'font-nepali' : ''
        }`,
        style: `min-height: ${minHeight}; padding: 12px;`
      }
    }
  })

  // Update editor content when active language changes
  React.useEffect(() => {
    if (editor && editor.getHTML() !== value[activeLanguage]) {
      editor.commands.setContent(value[activeLanguage])
    }
  }, [activeLanguage, editor, value])

  const ToolbarButton: React.FC<{
    onClick: () => void
    isActive?: boolean
    children: React.ReactNode
    title: string
  }> = ({ onClick, isActive, children, title }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-2 rounded-md border transition-colors ${
        isActive
          ? 'bg-primary-100 border-primary-300 text-primary-700'
          : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
      }`}
    >
      {children}
    </button>
  )

  return (
    <div className="space-y-3">
      {label && (
        <label className="block text-lg font-medium text-secondary-700 sm:text-base">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {showLanguageIndicator && (
        <div className="flex gap-2 mb-2">
          <button
            type="button"
            onClick={() => setActiveLanguage('en')}
            className={`px-3 py-1 text-sm rounded-md border transition-colors ${
              activeLanguage === 'en'
                ? 'bg-primary-100 border-primary-300 text-primary-700'
                : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'
            }`}
          >
            English {hasContent('en') && '✓'}
          </button>
          <button
            type="button"
            onClick={() => setActiveLanguage('ne')}
            className={`px-3 py-1 text-sm rounded-md border transition-colors ${
              activeLanguage === 'ne'
                ? 'bg-primary-100 border-primary-300 text-primary-700'
                : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'
            }`}
          >
            नेपाली {hasContent('ne') && '✓'}
          </button>
        </div>
      )}

      <div className="border border-gray-300 rounded-lg overflow-hidden">
        {/* Toolbar */}
        {editor && (
          <div className="border-b border-gray-200 bg-gray-50 p-2 flex flex-wrap gap-1">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              isActive={editor.isActive('bold')}
              title="Bold"
            >
              <strong>B</strong>
            </ToolbarButton>
            
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              isActive={editor.isActive('italic')}
              title="Italic"
            >
              <em>I</em>
            </ToolbarButton>
            
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleStrike().run()}
              isActive={editor.isActive('strike')}
              title="Strikethrough"
            >
              <s>S</s>
            </ToolbarButton>

            <div className="w-px h-6 bg-gray-300 mx-1" />

            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              isActive={editor.isActive('heading', { level: 1 })}
              title="Heading 1"
            >
              H1
            </ToolbarButton>
            
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              isActive={editor.isActive('heading', { level: 2 })}
              title="Heading 2"
            >
              H2
            </ToolbarButton>
            
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              isActive={editor.isActive('heading', { level: 3 })}
              title="Heading 3"
            >
              H3
            </ToolbarButton>

            <div className="w-px h-6 bg-gray-300 mx-1" />

            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              isActive={editor.isActive('bulletList')}
              title="Bullet List"
            >
              •
            </ToolbarButton>
            
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              isActive={editor.isActive('orderedList')}
              title="Numbered List"
            >
              1.
            </ToolbarButton>

            <div className="w-px h-6 bg-gray-300 mx-1" />

            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              isActive={editor.isActive('blockquote')}
              title="Quote"
            >
              "
            </ToolbarButton>

            <ToolbarButton
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              title="Horizontal Rule"
            >
              —
            </ToolbarButton>

            <div className="w-px h-6 bg-gray-300 mx-1" />

            <ToolbarButton
              onClick={() => editor.chain().focus().undo().run()}
              title="Undo"
            >
              ↶
            </ToolbarButton>
            
            <ToolbarButton
              onClick={() => editor.chain().focus().redo().run()}
              title="Redo"
            >
              ↷
            </ToolbarButton>
          </div>
        )}

        {/* Editor */}
        <div className={`
          ${error?.[activeLanguage] ? 'border-red-300' : 'border-gray-300'}
          ${activeLanguage === 'ne' ? 'font-nepali' : ''}
        `}>
          <EditorContent 
            editor={editor}
            className="prose prose-sm max-w-none p-3"
          />
        </div>
      </div>

      {error?.[activeLanguage] && (
        <p className="text-base text-red-600 flex items-center gap-2 sm:text-sm" role="alert">
          <span aria-hidden="true">⚠️</span>
          {error[activeLanguage]}
        </p>
      )}

      {helpText && !error?.[activeLanguage] && (
        <p className="text-base text-secondary-500 sm:text-sm">{helpText}</p>
      )}

      {/* Show completion status */}
      {showLanguageIndicator && (
        <div className="text-sm text-gray-500">
          {hasContent('en') && hasContent('ne') && (
            <span className="text-green-600">✓ Available in both languages</span>
          )}
          {hasContent('en') && !hasContent('ne') && (
            <span className="text-yellow-600">⚠ English only</span>
          )}
          {!hasContent('en') && hasContent('ne') && (
            <span className="text-yellow-600">⚠ Nepali only</span>
          )}
          {!hasContent('en') && !hasContent('ne') && required && (
            <span className="text-red-600">⚠ Required field</span>
          )}
        </div>
      )}
    </div>
  )
}