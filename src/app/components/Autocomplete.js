// src/app/components/Autocomplete.js

import React, { useEffect, useRef, useState } from 'react';
import { createAutocomplete } from '@algolia/autocomplete-core';
import { getAlgoliaResults } from '@algolia/autocomplete-preset-algolia';
import { createRoot } from 'react-dom/client';
import Link from 'next/link';
import styles from './Header.module.css'; // Reuse Header styles

export default function AutocompleteComponent({ searchClient, indexName, onSearch }) {
  const containerRef = useRef(null);
  const panelRootRef = useRef(null);
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const formRef = useRef(null);
  const [autocompleteState, setAutocompleteState] = useState({});

  const autocomplete = useRef(
    createAutocomplete({
      onStateChange: ({ state }) => {
        setAutocompleteState(state);
      },
      getSources: () => [
        {
          sourceId: indexName,
          getItems: ({ query }) =>
            getAlgoliaResults({
              searchClient,
              queries: [
                {
                  indexName,
                  query,
                },
              ],
            }),
          templates: {
            item({ item }) {
              return (
                <Link href={`/product/${item.objectID}`} className={styles['autocomplete-item']}>
                  {item.name} {/* Adjust based on your product fields */}
                </Link>
              );
            },
            noResults() {
              return <div className={styles['autocomplete-no-results']}>No results found.</div>;
            },
          },
        },
      ],
    })
  ).current;

  useEffect(() => {
    if (!containerRef.current) {
      return undefined;
    }

    const search = autocomplete({
      container: containerRef.current,
      renderer: { createElement: React.createElement, Fragment: React.Fragment, render: () => {} },
      render({ children }, root) {
        if (!panelRootRef.current || rootRef.current !== root) {
          rootRef.current = root;

          panelRootRef.current?.unmount();
          panelRootRef.current = createRoot(root);
        }

        panelRootRef.current.render(children);
      },
      ...autocomplete,
    });

    return () => {
      search.destroy();
    };
  }, [autocomplete]);

  // Handle environment props for mobile experience
  useEffect(() => {
    if (!(formRef.current && panelRootRef.current && inputRef.current)) {
      return;
    }

    const { getEnvironmentProps } = autocomplete;

    const { onTouchStart, onTouchMove, onMouseDown } = getEnvironmentProps({
      formElement: formRef.current,
      panelElement: panelRootRef.current,
      inputElement: inputRef.current,
    });

    window.addEventListener('touchstart', onTouchStart);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('mousedown', onMouseDown);

    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('mousedown', onMouseDown);
    };
  }, [autocomplete, autocompleteState.isOpen]);

  return (
    <div className={styles['aa-Autocomplete']} {...autocomplete.getRootProps({})}>
      <form
        ref={formRef}
        className={styles['aa-Form']}
        {...autocomplete.getFormProps({ inputElement: inputRef.current })}
        onSubmit={(e) => {
          e.preventDefault();
          if (autocompleteState.query.trim()) {
            onSearch(autocompleteState.query.trim());
          }
        }}
      >
        <div className={styles['aa-InputWrapperPrefix']}>
          <label className={styles['aa-Label']} {...autocomplete.getLabelProps({})}>
            Search
          </label>
        </div>
        <div className={styles['aa-InputWrapper']}>
          <input
            type="text"
            ref={inputRef}
            className={styles['searchInput']} // Reuse existing searchInput styles
            placeholder="Search..."
            {...autocomplete.getInputProps({})}
          />
        </div>
        {autocompleteState.query && (
          <div className={styles['aa-InputWrapperSuffix']}>
            <button
              type="button"
              className={styles['aa-ClearButton']}
              onClick={() => autocomplete.setQuery('')}
            >
              &#x2715;
            </button>
          </div>
        )}
      </form>

      {autocompleteState.isOpen && (
        <div
          ref={panelRootRef}
          className={[
            styles['aa-Panel'],
            autocompleteState.status === 'stalled' && styles['aa-Panel--stalled'],
          ]
            .filter(Boolean)
            .join(' ')}
          {...autocomplete.getPanelProps({})}
        >
          {autocompleteState.collections.map((collection, index) => (
            <div key={`source-${index}`} className={styles['aa-Source']}>
              {collection.items.length > 0 && (
                <ul className={styles['aa-List']} {...autocomplete.getListProps()}>
                  {collection.items.map((item) => (
                    <li
                      key={item.objectID}
                      className={styles['aa-Item']}
                      {...autocomplete.getItemProps({
                        item,
                        source: collection.source,
                      })}
                    >
                      {collection.source.templates.item({ item })}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
