import { inject, observer } from "mobx-react";
import { types } from "mobx-state-tree";
import ReactDOM from "react-dom";
import Registry from "../../core/Registry";

import { guidGenerator } from "../../core/Helpers";
import ProcessAttrsMixin from "../../mixins/ProcessAttrs";
import { AnnotationMixin } from "../../mixins/AnnotationMixin";
import { parseTypeAndOption, parseValue } from "../../utils/data";
import { BottomBar } from "../../components/BottomBar/BottomBar";

const Dialog = ({ text, toggle }) => {
  return (
    <div
      onClick={toggle}
      style={{
        top: 0,
        left: 0,
        zIndex: 1000,
        position: "fixed",
        width: "100vw",
        height: "100vh",
        padding: "32px",
        color: "white",
        backgroundColor: "rgba(0, 0, 0, 0.9)",
        whiteSpace: "pre-wrap"
      }}
    >
      {text}
      <div style={{ position: "absolute", bottom: "32px", right: "32px" }}>
        Нажмите где угодно, чтобы закрыть
      </div>
    </div>
  );
};

const Model = types
  .model({
    type: "stickytext",
    value: types.string,
    show: types.optional(types.boolean, false)
  })
  .actions(self => ({
    updateValue(store) {
      self.value = parseValue(self.value, store?.task?.dataObj ?? {});
    },
    toggle() {
      self.show = !self.show;

      let container = document.getElementById("stickytext-container");

      if (!container) {
        const el = document.createElement("div");
        el.id = "stickytext-container";
        document.body.appendChild(el);
        container = el;
      }

      if (self.show) {
        ReactDOM.render(
          <Dialog
            id="stickytext-dialog"
            text={self.value}
            toggle={self.toggle}
          />,
          container
        );
      } else {
        ReactDOM.unmountComponentAtNode(
          document.getElementById("stickytext-container")
        );
      }
    }
  }));

const StickyTextModel = types.compose(
  "StickyTextModel",
  ProcessAttrsMixin,
  Model
);

const HtxStickyText = inject("store")(
  observer(({ item }) => {
    return (
      <>
        <button
          onClick={item.toggle}
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            borderRadius: "7px",
            outline: "none",
            border: "none",
            color: "white",
            padding: "8px",
            float: "right",
            position: "sticky",
            top: "24px",
            zIndex: 1
          }}
        >
          {item.show ? "Скрыть текст" : "Показать текст"}
        </button>
      </>
    );
  })
);

Registry.addTag("stickytext", StickyTextModel, HtxStickyText);
Registry.addObjectType(StickyTextModel);

export { HtxStickyText, StickyTextModel };
