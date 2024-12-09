import React from 'react';
import { clsx } from 'clsx';
import CodeMirror from '@uiw/react-codemirror';
import { monokai } from '@uiw/codemirror-theme-monokai';
import { basicSetup } from 'codemirror';
import { indentUnit } from '@codemirror/language';
import { go } from '@codemirror/legacy-modes/mode/go';
import { StreamLanguage } from '@codemirror/language';
import { EditorView } from '@codemirror/view';

interface CustomConfigPanelProps {
  open: boolean;
  setOpen: (value: boolean) => void;
  showCustomConfig: boolean;
  customConfig: string;
  setCustomConfigPersistent: (value: string) => void;
  textClass: string;
  t: (key: string) => string;
}

export const CustomConfigPanel: React.FC<CustomConfigPanelProps> = ({
  open,
  setOpen,
  showCustomConfig,
  customConfig,
  setCustomConfigPersistent,
  textClass,
  t,
}) => {
  return (
    <>
      <button
        className={clsx(
          'absolute top-.5 right-0 translate-x-1/2',
          'h-7 w-7',
          'bg-[#ffffff]',
          'border-[1.5px] rounded-full',
          'items-center justify-center',
          'hidden sm:flex',
        )}
        onClick={() => {
          return setOpen(!open);
        }}
      >
        <svg
          className={clsx('h-8 w-8')}
          style={{
            transform: open ? 'rotateZ(0deg)' : 'rotateZ(180deg)',
          }}
          viewBox="0 0 24 24"
        >
          <path fill={'currentColor'} d="M15.41,16.58L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.58Z" />
        </svg>
      </button>

      <div className={'pt-6 h-12 pl-2 flex items-center font-bold'}>
        {(showCustomConfig || open) && <div className={textClass}>{t('Custom config')}</div>}
      </div>

      <div className="flex-grow overflow-auto h-full">
        {(showCustomConfig || open) && (
          <div className="flex flex-col h-full">
            <CodeMirror
              height="100%"
              onChange={setCustomConfigPersistent}
              theme={monokai}
              basicSetup={{
                lineNumbers: true,
                highlightActiveLine: true,
                bracketMatching: true,
                indentOnInput: true,
              }}
              extensions={[basicSetup, StreamLanguage.define(go), indentUnit.of('    '), EditorView.lineWrapping]}
              className="function flex-grow"
              value={customConfig}
            />
          </div>
        )}
      </div>
    </>
  );
};
