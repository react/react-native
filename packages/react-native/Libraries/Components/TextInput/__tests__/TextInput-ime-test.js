/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const {enter} = require('../../../Utilities/ReactNativeTestTools');
const TextInput = require('../TextInput').default;
const React = require('react');
const {createRef, useState} = require('react');
const ReactTestRenderer = require('react-test-renderer');

jest.unmock('../TextInput');

/**
 * Tests that verify JS-level TextInput behavior during IME composition
 * scenarios. The actual IME guards (markedTextRange checks, deferred
 * defaultTextAttributes, etc.) are in the native layer and tested by
 * RCTTextInputComponentViewIMETests.mm. These tests verify that the JS
 * component correctly handles the event patterns produced by native
 * during CJK composition.
 */
describe('TextInput IME composition behavior', () => {
  describe('controlled component with CJK composition', () => {
    it('handles intermediate composition text via onChange', () => {
      // Simulates Korean IME: ㅎ → 하 → 한 → 한글
      // Each step fires onChange from native. The controlled component should
      // update its value at each step without losing state.
      const onChangeText = jest.fn();
      let currentText = '';

      function ControlledInput() {
        const [text, setText] = useState('');
        currentText = text;
        return (
          <TextInput
            value={text}
            onChangeText={t => {
              onChangeText(t);
              setText(t);
            }}
          />
        );
      }

      let renderer;
      ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<ControlledInput />);
      });

      // $FlowFixMe[incompatible-use]
      const input = renderer.root.findByType(TextInput);

      // Simulate Korean composition steps
      const compositionSteps = ['ㅎ', '하', '한', '한글'];
      compositionSteps.forEach(step => {
        ReactTestRenderer.act(() => {
          enter(input, step);
        });
      });

      expect(onChangeText).toHaveBeenCalledTimes(4);
      expect(onChangeText.mock.calls.map(c => c[0])).toEqual(compositionSteps);
      expect(currentText).toBe('한글');
    });

    it('handles Japanese romaji-to-hiragana conversion', () => {
      // Japanese IME romaji input: typing "k","a","n","j","i" produces:
      // k → か (ka) → かn → かん (kan) → かんj → かんじ (kanji) → 漢字 (kanji conversion)
      const onChangeText = jest.fn();
      let currentText = '';

      function ControlledInput() {
        const [text, setText] = useState('');
        currentText = text;
        return (
          <TextInput
            value={text}
            onChangeText={t => {
              onChangeText(t);
              setText(t);
            }}
          />
        );
      }

      let renderer;
      ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<ControlledInput />);
      });

      // $FlowFixMe[incompatible-use]
      const input = renderer.root.findByType(TextInput);

      // Romaji "kanji" → hiragana → kanji conversion
      const compositionSteps = [
        'k', // raw romaji, still composing
        'か', // "ka" converted to hiragana
        'かn', // next consonant buffered
        'かん', // "kan" complete
        'かんj', // next consonant buffered
        'かんじ', // "kanji" in hiragana
        '漢字', // user selected kanji conversion from candidate list
      ];
      compositionSteps.forEach(step => {
        ReactTestRenderer.act(() => {
          enter(input, step);
        });
      });

      expect(onChangeText).toHaveBeenCalledTimes(7);
      expect(currentText).toBe('漢字');
    });

    it('handles Japanese romaji-to-katakana conversion', () => {
      // Some IME modes convert romaji directly to katakana:
      // "to" → "と" → "トウキョウ" → "東京" (or user keeps katakana)
      const onChangeText = jest.fn();
      let currentText = '';

      function ControlledInput() {
        const [text, setText] = useState('');
        currentText = text;
        return (
          <TextInput
            value={text}
            onChangeText={t => {
              onChangeText(t);
              setText(t);
            }}
          />
        );
      }

      let renderer;
      ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<ControlledInput />);
      });

      // $FlowFixMe[incompatible-use]
      const input = renderer.root.findByType(TextInput);

      const compositionSteps = [
        't',
        'と', // "to" → hiragana
        'とう',
        'とうk',
        'とうき',
        'とうきょ',
        'とうきょう',
        '東京', // kanji conversion selected
      ];
      compositionSteps.forEach(step => {
        ReactTestRenderer.act(() => {
          enter(input, step);
        });
      });

      expect(onChangeText).toHaveBeenCalledTimes(8);
      expect(currentText).toBe('東京');
    });

    it('handles Japanese composition with candidate re-selection', () => {
      // User types "hashi", gets 橋, re-selects to 箸, then confirms
      const onChangeText = jest.fn();
      let currentText = '';

      function ControlledInput() {
        const [text, setText] = useState('');
        currentText = text;
        return (
          <TextInput
            value={text}
            onChangeText={t => {
              onChangeText(t);
              setText(t);
            }}
          />
        );
      }

      let renderer;
      ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<ControlledInput />);
      });

      // $FlowFixMe[incompatible-use]
      const input = renderer.root.findByType(TextInput);

      const compositionSteps = [
        'h',
        'は',
        'はs',
        'はし', // "hashi" in hiragana
        '橋', // first candidate
        '箸', // user scrolls to different candidate
        '端', // another candidate
        '箸', // user goes back and confirms
      ];
      compositionSteps.forEach(step => {
        ReactTestRenderer.act(() => {
          enter(input, step);
        });
      });

      expect(onChangeText).toHaveBeenCalledTimes(8);
      expect(currentText).toBe('箸');
    });

    it('handles Chinese Pinyin composition', () => {
      // Chinese Pinyin IME: typing "zhongguo" produces:
      // z → zh → zho → zhon → zhong → 中 (selected from candidates)
      // Then "guo" → 国 → 中国
      const onChangeText = jest.fn();
      let currentText = '';

      function ControlledInput() {
        const [text, setText] = useState('');
        currentText = text;
        return (
          <TextInput
            value={text}
            onChangeText={t => {
              onChangeText(t);
              setText(t);
            }}
          />
        );
      }

      let renderer;
      ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<ControlledInput />);
      });

      // $FlowFixMe[incompatible-use]
      const input = renderer.root.findByType(TextInput);

      // First character: "zhong" → 中
      const firstChar = ['z', 'zh', 'zho', 'zhon', 'zhong', '中'];
      firstChar.forEach(step => {
        ReactTestRenderer.act(() => {
          enter(input, step);
        });
      });

      expect(currentText).toBe('中');

      // Second character: "guo" → 国, appended after 中
      const secondChar = ['中g', '中gu', '中guo', '中国'];
      secondChar.forEach(step => {
        ReactTestRenderer.act(() => {
          enter(input, step);
        });
      });

      expect(onChangeText).toHaveBeenCalledTimes(10);
      expect(currentText).toBe('中国');
    });

    it('handles Chinese Wubi stroke-based input', () => {
      // Wubi IME uses letter keys as stroke codes: e.g., "ggtt" → 王
      const onChangeText = jest.fn();
      let currentText = '';

      function ControlledInput() {
        const [text, setText] = useState('');
        currentText = text;
        return (
          <TextInput
            value={text}
            onChangeText={t => {
              onChangeText(t);
              setText(t);
            }}
          />
        );
      }

      let renderer;
      ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<ControlledInput />);
      });

      // $FlowFixMe[incompatible-use]
      const input = renderer.root.findByType(TextInput);

      // Wubi input for 王 (wang/king)
      const compositionSteps = ['g', 'gg', 'ggt', 'ggtt', '王'];
      compositionSteps.forEach(step => {
        ReactTestRenderer.act(() => {
          enter(input, step);
        });
      });

      expect(onChangeText).toHaveBeenCalledTimes(5);
      expect(currentText).toBe('王');
    });

    it('handles Chinese Zhuyin (Bopomofo) input', () => {
      // Zhuyin IME (used in Taiwan): ㄓㄨㄥ → 中
      const onChangeText = jest.fn();
      let currentText = '';

      function ControlledInput() {
        const [text, setText] = useState('');
        currentText = text;
        return (
          <TextInput
            value={text}
            onChangeText={t => {
              onChangeText(t);
              setText(t);
            }}
          />
        );
      }

      let renderer;
      ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<ControlledInput />);
      });

      // $FlowFixMe[incompatible-use]
      const input = renderer.root.findByType(TextInput);

      const compositionSteps = ['ㄓ', 'ㄓㄨ', 'ㄓㄨㄥ', '中'];
      compositionSteps.forEach(step => {
        ReactTestRenderer.act(() => {
          enter(input, step);
        });
      });

      expect(onChangeText).toHaveBeenCalledTimes(4);
      expect(currentText).toBe('中');
    });

    it('handles Korean multi-syllable composition', () => {
      // Korean IME builds syllables incrementally:
      // ㄱ → 가 → 감 → 감ㅅ → 감사 → 감사ㅎ → 감사하 → 감사합 → 감사합ㄴ → 감사합니 → 감사합니ㄷ → 감사합니다
      const onChangeText = jest.fn();
      let currentText = '';

      function ControlledInput() {
        const [text, setText] = useState('');
        currentText = text;
        return (
          <TextInput
            value={text}
            onChangeText={t => {
              onChangeText(t);
              setText(t);
            }}
          />
        );
      }

      let renderer;
      ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<ControlledInput />);
      });

      // $FlowFixMe[incompatible-use]
      const input = renderer.root.findByType(TextInput);

      const compositionSteps = [
        'ㄱ',
        '가',
        '감',
        '감ㅅ',
        '감사',
        '감사ㅎ',
        '감사하',
        '감사합',
        '감사합ㄴ',
        '감사합니',
        '감사합니ㄷ',
        '감사합니다',
      ];
      compositionSteps.forEach(step => {
        ReactTestRenderer.act(() => {
          enter(input, step);
        });
      });

      expect(onChangeText).toHaveBeenCalledTimes(12);
      expect(currentText).toBe('감사합니다');
    });

    it('preserves existing text when composition appends', () => {
      // User types "hello" then starts CJK composition: "hello" → "helloㅎ" → "hello하" → "hello한"
      const onChangeText = jest.fn();
      let currentText = '';

      function ControlledInput() {
        const [text, setText] = useState('hello');
        currentText = text;
        return (
          <TextInput
            value={text}
            onChangeText={t => {
              onChangeText(t);
              setText(t);
            }}
          />
        );
      }

      let renderer;
      ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<ControlledInput />);
      });

      // $FlowFixMe[incompatible-use]
      const input = renderer.root.findByType(TextInput);

      ReactTestRenderer.act(() => {
        enter(input, 'helloㅎ');
      });
      ReactTestRenderer.act(() => {
        enter(input, 'hello하');
      });
      ReactTestRenderer.act(() => {
        enter(input, 'hello한');
      });

      expect(onChangeText).toHaveBeenCalledTimes(3);
      expect(currentText).toBe('hello한');
    });
  });

  describe('controlled component with maxLength and CJK', () => {
    it('allows composition text through onChange even at maxLength boundary', () => {
      // With maxLength=5 and existing text "1234", native allows composition
      // past the limit during IME (enforced after commit). The JS side should
      // receive the full text from native's onChange event.
      const onChangeText = jest.fn();

      function ControlledInput() {
        const [text, setText] = useState('1234');
        return (
          <TextInput
            value={text}
            maxLength={5}
            onChangeText={t => {
              onChangeText(t);
              setText(t);
            }}
          />
        );
      }

      let renderer;
      ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<ControlledInput />);
      });

      // $FlowFixMe[incompatible-use]
      const input = renderer.root.findByType(TextInput);

      // During composition, native sends text that may temporarily exceed maxLength.
      // JS receives it as-is from native onChange.
      ReactTestRenderer.act(() => {
        enter(input, '1234ㅎ');
      });
      expect(onChangeText).toHaveBeenLastCalledWith('1234ㅎ');

      // After composition commits, native truncates and sends final text.
      ReactTestRenderer.act(() => {
        enter(input, '1234한');
      });
      expect(onChangeText).toHaveBeenLastCalledWith('1234한');

      // Native may send truncated text after enforcing maxLength post-commit.
      ReactTestRenderer.act(() => {
        enter(input, '12345');
      });
      expect(onChangeText).toHaveBeenLastCalledWith('12345');
    });
  });

  describe('uncontrolled component with CJK composition', () => {
    it('fires onChange and onChangeText during composition', () => {
      const onChange = jest.fn();
      const onChangeText = jest.fn();

      let renderer;
      ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(
          <TextInput onChange={onChange} onChangeText={onChangeText} />,
        );
      });

      // $FlowFixMe[incompatible-use]
      const input = renderer.root.findByType(TextInput);

      ReactTestRenderer.act(() => {
        enter(input, 'ㅎ');
      });
      ReactTestRenderer.act(() => {
        enter(input, '한');
      });

      expect(onChange).toHaveBeenCalledTimes(2);
      expect(onChangeText).toHaveBeenCalledTimes(2);
      expect(onChangeText.mock.calls).toEqual([['ㅎ'], ['한']]);
    });
  });

  describe('multiline with CJK composition', () => {
    it('handles composition in multiline mode', () => {
      const onChangeText = jest.fn();
      let currentText = '';

      function ControlledMultiline() {
        const [text, setText] = useState('line1\n');
        currentText = text;
        return (
          <TextInput
            multiline
            value={text}
            onChangeText={t => {
              onChangeText(t);
              setText(t);
            }}
          />
        );
      }

      let renderer;
      ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<ControlledMultiline />);
      });

      // $FlowFixMe[incompatible-use]
      const input = renderer.root.findByType(TextInput);

      // Composition on second line
      ReactTestRenderer.act(() => {
        enter(input, 'line1\nㅎ');
      });
      ReactTestRenderer.act(() => {
        enter(input, 'line1\n한');
      });
      ReactTestRenderer.act(() => {
        enter(input, 'line1\n한글');
      });

      expect(onChangeText).toHaveBeenCalledTimes(3);
      expect(currentText).toBe('line1\n한글');
    });
  });

  describe('mixed Latin and CJK input', () => {
    it('handles switching from Latin to Japanese mid-sentence', () => {
      // User types "Hello " in Latin, then switches to Japanese IME
      const onChangeText = jest.fn();
      let currentText = '';

      function ControlledInput() {
        const [text, setText] = useState('');
        currentText = text;
        return (
          <TextInput
            value={text}
            onChangeText={t => {
              onChangeText(t);
              setText(t);
            }}
          />
        );
      }

      let renderer;
      ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<ControlledInput />);
      });

      // $FlowFixMe[incompatible-use]
      const input = renderer.root.findByType(TextInput);

      // Latin portion typed directly
      ReactTestRenderer.act(() => {
        enter(input, 'Hello ');
      });

      // Japanese IME activated, typing "sekai" → 世界
      const compositionSteps = [
        'Hello s',
        'Hello せ',
        'Hello せk',
        'Hello せか',
        'Hello せかi',
        'Hello せかい',
        'Hello 世界',
      ];
      compositionSteps.forEach(step => {
        ReactTestRenderer.act(() => {
          enter(input, step);
        });
      });

      expect(currentText).toBe('Hello 世界');
    });

    it('handles switching from Chinese to Latin mid-sentence', () => {
      // User types Chinese first, then switches to Latin
      const onChangeText = jest.fn();
      let currentText = '';

      function ControlledInput() {
        const [text, setText] = useState('');
        currentText = text;
        return (
          <TextInput
            value={text}
            onChangeText={t => {
              onChangeText(t);
              setText(t);
            }}
          />
        );
      }

      let renderer;
      ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<ControlledInput />);
      });

      // $FlowFixMe[incompatible-use]
      const input = renderer.root.findByType(TextInput);

      // Chinese Pinyin: "ni" → 你
      ['n', 'ni', '你'].forEach(step => {
        ReactTestRenderer.act(() => {
          enter(input, step);
        });
      });

      // Chinese Pinyin: "hao" → 好
      ['你h', '你ha', '你hao', '你好'].forEach(step => {
        ReactTestRenderer.act(() => {
          enter(input, step);
        });
      });

      // Switch to Latin and type directly
      ReactTestRenderer.act(() => {
        enter(input, '你好 World');
      });

      expect(currentText).toBe('你好 World');
    });

    it('handles Korean input between Latin words', () => {
      // "React 네이티브 is great"
      const onChangeText = jest.fn();
      let currentText = '';

      function ControlledInput() {
        const [text, setText] = useState('');
        currentText = text;
        return (
          <TextInput
            value={text}
            onChangeText={t => {
              onChangeText(t);
              setText(t);
            }}
          />
        );
      }

      let renderer;
      ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<ControlledInput />);
      });

      // $FlowFixMe[incompatible-use]
      const input = renderer.root.findByType(TextInput);

      // "React " typed in Latin
      ReactTestRenderer.act(() => {
        enter(input, 'React ');
      });

      // Korean composition: 네이티브
      const koreanSteps = [
        'React ㄴ',
        'React 네',
        'React 네ㅇ',
        'React 네이',
        'React 네이ㅌ',
        'React 네이티',
        'React 네이티ㅂ',
        'React 네이티브',
      ];
      koreanSteps.forEach(step => {
        ReactTestRenderer.act(() => {
          enter(input, step);
        });
      });

      // Back to Latin
      ReactTestRenderer.act(() => {
        enter(input, 'React 네이티브 is great');
      });

      expect(currentText).toBe('React 네이티브 is great');
    });
  });

  describe('continuous CJK sentence composition', () => {
    it('handles Japanese sentence with multiple conversions', () => {
      // Typing "watashiha" → 私は, then "gakusei" → 学生, then "desu" → です
      const onChangeText = jest.fn();
      let currentText = '';

      function ControlledInput() {
        const [text, setText] = useState('');
        currentText = text;
        return (
          <TextInput
            value={text}
            onChangeText={t => {
              onChangeText(t);
              setText(t);
            }}
          />
        );
      }

      let renderer;
      ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<ControlledInput />);
      });

      // $FlowFixMe[incompatible-use]
      const input = renderer.root.findByType(TextInput);

      // First word: watashi → 私
      ['w', 'わ', 'わt', 'わた', 'わたs', 'わたし', '私'].forEach(step => {
        ReactTestRenderer.act(() => {
          enter(input, step);
        });
      });

      // Particle: ha → は
      ['私h', '私は'].forEach(step => {
        ReactTestRenderer.act(() => {
          enter(input, step);
        });
      });

      // Second word: gakusei → 学生
      [
        '私はg',
        '私はが',
        '私はがk',
        '私はがく',
        '私はがくs',
        '私はがくせ',
        '私はがくせi',
        '私はがくせい',
        '私は学生',
      ].forEach(step => {
        ReactTestRenderer.act(() => {
          enter(input, step);
        });
      });

      // Copula: desu → です
      ['私は学生d', '私は学生で', '私は学生でs', '私は学生です'].forEach(
        step => {
          ReactTestRenderer.act(() => {
            enter(input, step);
          });
        },
      );

      expect(currentText).toBe('私は学生です');
    });

    it('handles Chinese Pinyin sentence input', () => {
      // Typing "wo ai zhongguo" → 我爱中国
      const onChangeText = jest.fn();
      let currentText = '';

      function ControlledInput() {
        const [text, setText] = useState('');
        currentText = text;
        return (
          <TextInput
            value={text}
            onChangeText={t => {
              onChangeText(t);
              setText(t);
            }}
          />
        );
      }

      let renderer;
      ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<ControlledInput />);
      });

      // $FlowFixMe[incompatible-use]
      const input = renderer.root.findByType(TextInput);

      // "wo" → 我
      ['w', 'wo', '我'].forEach(step => {
        ReactTestRenderer.act(() => {
          enter(input, step);
        });
      });

      // "ai" → 爱
      ['我a', '我ai', '我爱'].forEach(step => {
        ReactTestRenderer.act(() => {
          enter(input, step);
        });
      });

      // "zhongguo" → 中国
      [
        '我爱z',
        '我爱zh',
        '我爱zho',
        '我爱zhon',
        '我爱zhong',
        '我爱中',
        '我爱中g',
        '我爱中gu',
        '我爱中guo',
        '我爱中国',
      ].forEach(step => {
        ReactTestRenderer.act(() => {
          enter(input, step);
        });
      });

      expect(currentText).toBe('我爱中国');
    });
  });

  describe('value prop change during simulated composition', () => {
    it('controlled component can set value after composition text arrives', () => {
      // Simulates: native fires onChange with composition text, then JS
      // transforms the text (e.g., uppercase) and sets it back.
      const ref = createRef<React.ElementRef<typeof TextInput>>();

      function TransformingInput() {
        const [text, setText] = useState('');
        return (
          <TextInput
            ref={ref}
            value={text}
            onChangeText={t => {
              // Transform: just accept the text as-is
              setText(t);
            }}
          />
        );
      }

      let renderer;
      ReactTestRenderer.act(() => {
        renderer = ReactTestRenderer.create(<TransformingInput />);
      });

      // $FlowFixMe[incompatible-use]
      const input = renderer.root.findByType(TextInput);

      // Composition intermediate
      ReactTestRenderer.act(() => {
        enter(input, '한');
      });

      expect(input.props.value).toBe('한');

      // Final committed text
      ReactTestRenderer.act(() => {
        enter(input, '한글');
      });

      expect(input.props.value).toBe('한글');
    });
  });
});
