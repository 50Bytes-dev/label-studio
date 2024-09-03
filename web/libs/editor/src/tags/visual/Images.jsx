import { inject, observer } from "mobx-react";
import { types } from "mobx-state-tree";
import Registry from "../../core/Registry";

import { guidGenerator } from "../../core/Helpers";
import ProcessAttrsMixin from "../../mixins/ProcessAttrs";
import { AnnotationMixin } from "../../mixins/AnnotationMixin";
import { parseTypeAndOption, parseValue } from "../../utils/data";

const Model = types
  .model({
    type: "images",
    value: types.frozen(),
    activeIndex: types.optional(types.integer, 0)
  })
  .views(self => ({
    get activeImage() {
      return self.value[self.activeIndex];
    }
  }))
  .actions(self => ({
    setActiveIndex(index) {
      self.activeIndex = index;
    },
    updateValue(store) {
      self.value = parseValue(self.value, store?.task?.dataObj ?? {});
    }
  }));

const ImagesModel = types.compose("ImagesModel", ProcessAttrsMixin, Model);

const HtxImages = inject("store")(
  observer(({ item }) => {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div>
          <img
            src={item.activeImage}
            style={{ height: "72vh", objectFit: "contain" }}
          />
        </div>
        <div
          style={{
            height: "200px",
            display: "flex",
            gap: "16px",
            overflowX: "auto"
          }}
        >
          {item.value &&
            item.value.map((image, index) => {
              return (
                <div
                  key={index}
                  style={{
                    position: "relative",
                    border:
                      item.activeIndex === index ? "5px solid red" : undefined
                  }}
                >
                  <img
                    onClick={() => item.setActiveIndex(index)}
                    style={{ height: "100%" }}
                    src={image}
                  />
                  <div
                    style={{
                      position: "absolute",
                      left: "8px",
                      top: "8px",
                      background: item.activeIndex === index ? "red" : "black",
                      color: item.activeIndex === index ? "white" : "white",
                      fontWeight: "bolder",
                      padding: "4px",
                      fontSize: "18px"
                    }}
                  >
                    {index + 1}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    );
  })
);

Registry.addTag("images", ImagesModel, HtxImages);
Registry.addObjectType(ImagesModel);

export { HtxImages, ImagesModel };
