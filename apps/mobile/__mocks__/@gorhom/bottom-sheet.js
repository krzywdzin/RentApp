const React = require('react');

const BottomSheet = React.forwardRef((props, ref) =>
  React.createElement('View', null, props.children),
);

const BottomSheetModal = React.forwardRef((props, ref) =>
  React.createElement('View', null, props.children),
);

const BottomSheetModalProvider = ({ children }) =>
  React.createElement('View', null, children);

module.exports = {
  __esModule: true,
  default: BottomSheet,
  BottomSheet,
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetView: ({ children }) => React.createElement('View', null, children),
  BottomSheetScrollView: ({ children }) => React.createElement('View', null, children),
  BottomSheetBackdrop: () => React.createElement('View', null),
  useBottomSheetModal: () => ({ dismiss: jest.fn(), present: jest.fn() }),
};
