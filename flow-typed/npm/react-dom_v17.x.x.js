declare module 'react-dom' {
  import type {Component} from 'react';

  declare var version: string;

  declare function findDOMNode(
    componentOrElement: Element | ?Component<any, any>,
  ): null | Element | Text;

  declare function render<ElementType: React.ElementType>(
    element: ExactReactElement_DEPRECATED<ElementType>,
    container: Element,
    callback?: () => void,
  ): React.ElementRef<ElementType>;

  declare function hydrate<ElementType: React.ElementType>(
    element: ExactReactElement_DEPRECATED<ElementType>,
    container: Element,
    callback?: () => void,
  ): React.ElementRef<ElementType>;

  declare function createPortal(
    node: React.Node,
    container: Element,
  ): React.Portal;

  declare function unmountComponentAtNode(container: any): boolean;

  declare function unstable_batchedUpdates<A, B, C, D, E>(
    callback: (a: A, b: B, c: C, d: D, e: E) => unknown,
    a: A,
    b: B,
    c: C,
    d: D,
    e: E,
  ): void;

  declare function unstable_renderSubtreeIntoContainer<
    ElementType: React.ElementType,
  >(
    parentComponent: Component<any, any>,
    nextElement: ExactReactElement_DEPRECATED<ElementType>,
    container: any,
    callback?: () => void,
  ): React.ElementRef<ElementType>;
}

declare module 'react-dom/server' {
  declare var version: string;

  declare function renderToString(element: React.Node): string;

  declare function renderToStaticMarkup(element: React.Node): string;

  declare function renderToNodeStream(element: React.Node): stream$Readable;

  declare function renderToStaticNodeStream(
    element: React.Node,
  ): stream$Readable;
}

declare module 'react-dom/test-utils' {
  import type {Component} from 'react';

  declare interface Thenable {
    then(resolve: () => unknown, reject?: () => unknown): unknown;
  }

  declare var Simulate: {
    [eventName: string]: (
      element: Element,
      eventData?: {[key: string]: unknown, ...},
    ) => void,
    ...
  };

  declare function renderIntoDocument(
    instance: React.MixedElement,
  ): Component<any, any>;

  declare function mockComponent(
    componentClass: React.ElementType,
    mockTagName?: string,
  ): {[key: string]: unknown, ...};

  declare function isElement(element: React.MixedElement): boolean;

  declare function isElementOfType(
    element: React.MixedElement,
    componentClass: React.ElementType,
  ): boolean;

  declare function isDOMComponent(instance: any): boolean;

  declare function isCompositeComponent(instance: Component<any, any>): boolean;

  declare function isCompositeComponentWithType(
    instance: Component<any, any>,
    componentClass: React.ElementType,
  ): boolean;

  declare function findAllInRenderedTree(
    tree: Component<any, any>,
    test: (child: Component<any, any>) => boolean,
  ): Array<Component<any, any>>;

  declare function scryRenderedDOMComponentsWithClass(
    tree: Component<any, any>,
    className: string,
  ): Array<Element>;

  declare function findRenderedDOMComponentWithClass(
    tree: Component<any, any>,
    className: string,
  ): ?Element;

  declare function scryRenderedDOMComponentsWithTag(
    tree: Component<any, any>,
    tagName: string,
  ): Array<Element>;

  declare function findRenderedDOMComponentWithTag(
    tree: Component<any, any>,
    tagName: string,
  ): ?Element;

  declare function scryRenderedComponentsWithType(
    tree: Component<any, any>,
    componentClass: React.ElementType,
  ): Array<Component<any, any>>;

  declare function findRenderedComponentWithType(
    tree: Component<any, any>,
    componentClass: React.ElementType,
  ): ?Component<any, any>;

  declare function act(callback: () => void | Thenable): Thenable;
}
