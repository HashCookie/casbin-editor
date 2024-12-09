import React, { useState } from 'react';
import { clsx } from 'clsx';
import CodeMirror from '@uiw/react-codemirror';
import { monokai } from '@uiw/codemirror-theme-monokai';
import { basicSetup } from 'codemirror';
import { indentUnit } from '@codemirror/language';
import { StreamLanguage } from '@codemirror/language';
import { go } from '@codemirror/legacy-modes/mode/go';
import { EditorView } from '@codemirror/view';

interface FunctionConfig {
  id: string;
  name: string;
  body: string;
}

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
  const [functions, setFunctions] = useState<FunctionConfig[]>([]);

  // Add new function
  const addNewFunction = () => {
    const newFunction = {
      id: Date.now().toString(),
      name: `my_func${functions.length + 1}`,
      body: '(arg1, arg2) => {\n  return arg1.endsWith(arg2);\n}',
    };
    setFunctions([...functions, newFunction]);
    updateCustomConfig([...functions, newFunction]);
  };

  // Delete function
  const deleteFunction = (id: string) => {
    const updatedFunctions = functions.filter((f) => {
      return f.id !== id;
    });
    setFunctions(updatedFunctions);
    updateCustomConfig(updatedFunctions);
  };

  // Update function content
  const updateFunction = (id: string, field: keyof FunctionConfig, value: string) => {
    const updatedFunctions = functions.map((f) => {
      if (f.id === id) {
        return { ...f, [field]: value };
      }
      return f;
    });
    setFunctions(updatedFunctions);
    updateCustomConfig(updatedFunctions);
  };

  // Add new matching function
  const addMatchingFunction = () => {
    if (
      functions.some((f) => {
        return f.name === 'matchingForGFunction';
      })
    ) {
      alert('Role Matching Function already exists!');
      return;
    }

    const template = {
      id: Date.now().toString(),
      name: 'matchingForGFunction',
      body: `(user, role) => {
  return user.department === role.department;
}`,
    };
    setFunctions([...functions, template]);
    updateCustomConfig([...functions, template]);
  };

  // Add new matching domain function
  const addMatchingDomainFunction = () => {
    if (
      functions.some((f) => {
        return f.name === 'matchingDomainForGFunction';
      })
    ) {
      alert('Domain Matching Function already exists!');
      return;
    }

    const template = {
      id: Date.now().toString(),
      name: 'matchingDomainForGFunction',
      body: `(domain1, domain2) => {
  return domain1.startsWith(domain2);
}`,
    };
    setFunctions([...functions, template]);
    updateCustomConfig([...functions, template]);
  };

  // Generate a complete configuration string.
  const updateCustomConfig = (updatedFunctions: FunctionConfig[]) => {
    const regularFunctions: FunctionConfig[] = [];
    let matchingFn = '';
    let matchingDomainFn = '';

    // Classification processing function
    updatedFunctions.forEach((f) => {
      if (f.name === 'matchingForGFunction') {
        matchingFn = f.body;
      } else if (f.name === 'matchingDomainForGFunction') {
        matchingDomainFn = f.body;
      } else {
        regularFunctions.push(f);
      }
    });

    // Generate regular function string
    const functionsString = regularFunctions
      .map((f) => {
        return `
        ${f.name}: ${f.body}
    `;
      })
      .join(',\n');

    const configString = `(function() {
      return {
        functions: {
          ${functionsString}
        },
        matchingForGFunction: ${matchingFn || 'undefined'},
        matchingDomainForGFunction: ${matchingDomainFn || 'undefined'}
      };
    })();`;

    setCustomConfigPersistent(configString);
  };

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

      {(showCustomConfig || open) && (
        <div className="flex flex-col h-full">
          <div className={'pt-6 h-12 pl-2 flex items-center font-bold'}>
            <div className={textClass}>{t('Custom Functions')}</div>
          </div>

          <div className="flex-grow overflow-auto " style={{ height: '100vh' }}>
            {functions.map((func) => {
              return (
                <div key={func.id} className="bg-gray-100 rounded-lg flex flex-col" style={{ height: '50%' }}>
                  <div className="flex justify-between items-center p-2">
                    <input
                      type="text"
                      value={func.name}
                      onChange={(e) => {
                        return updateFunction(func.id, 'name', e.target.value);
                      }}
                      className="px-2 py-1 border rounded"
                      placeholder={t('Function name')}
                      disabled={func.name === 'matchingForGFunction' || func.name === 'matchingDomainForGFunction'}
                    />
                    <button
                      onClick={() => {
                        return deleteFunction(func.id);
                      }}
                      className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors"
                      title={t('Delete')}
                    >
                      <svg viewBox="0 0 24 24" className="w-4 h-4">
                        <path
                          fill="currentColor"
                          d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
                        />
                      </svg>
                    </button>
                  </div>

                  <div className="flex-1">
                    <CodeMirror
                      value={func.body}
                      height="100%"
                      theme={monokai}
                      onChange={(value) => {
                        return updateFunction(func.id, 'body', value);
                      }}
                      basicSetup={{
                        lineNumbers: true,
                        highlightActiveLine: true,
                        bracketMatching: true,
                        indentOnInput: true,
                      }}
                      extensions={[basicSetup, StreamLanguage.define(go), indentUnit.of('    '), EditorView.lineWrapping]}
                      className="h-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-2 m-1 mb-0 text-xs">
            <button
              onClick={addNewFunction}
              className={clsx(
                'px-3 py-1',
                'border border-[#453d7d]',
                'text-[#453d7a]',
                'bg-[#efefef]',
                'rounded',
                'hover:bg-[#453d7d] hover:text-white',
                'transition-colors duration-500',
              )}
            >
              {t('Add Function')}
            </button>
            <button
              onClick={addMatchingFunction}
              className={clsx(
                'px-3 py-1',
                'border border-[#453d7d]',
                'text-[#453d7a]',
                'bg-[#efefef]',
                'rounded',
                'hover:bg-[#453d7d] hover:text-white',
                'transition-colors duration-500',
              )}
            >
              {t('Add Role Matching')}
            </button>
            <button
              onClick={addMatchingDomainFunction}
              className={clsx(
                'px-3 py-1',
                'border border-[#453d7d]',
                'text-[#453d7a]',
                'bg-[#efefef]',
                'rounded',
                'hover:bg-[#453d7d] hover:text-white',
                'transition-colors duration-500',
              )}
            >
              {t('Add Domain Matching')}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
