import { inject, observer } from "mobx-react";
import { types } from "mobx-state-tree";
import Registry from "../../core/Registry";
import React from "react";

import ControlBase from "./Base";
import ClassificationBase from "./ClassificationBase";
import PerRegionMixin from "../../mixins/PerRegion";
import { AnnotationMixin } from "../../mixins/AnnotationMixin";
import { guidGenerator } from "../../core/Helpers";
import { isDefined } from "../../utils/utilities";
import { Divider } from "antd";

const TagAttrs = types.model({
  toname: types.maybeNull(types.string),
  options: types.string,
  categoriesjson: types.string
});

const Model = types
  .model({
    pid: types.optional(types.string, guidGenerator),
    type: "productsdata",
    products: types.frozen()
  })
  .views(self => ({
    selectedValues() {
      return self.products;
    },
    get holdsState() {
      return isDefined(self.products);
    },
    get paramOptions() {
      return self.options.split(",");
    },
    get categories() {
      return JSON.parse(self.categoriesjson);
    }
  }))
  .actions(self => ({
    update() {
      self.products = [...self.products];
    },

    needsUpdate() {
      if (self.result) self.products = self.result.mainValue;
      else self.products = [];
    },

    updateFromResult() {
      this.needsUpdate();
    },

    addValue(list, value = "") {
      list.push(value);
      self.update();
    },

    removeValue(list, index) {
      list.splice(index, 1);
      self.update();
    },

    addProduct() {
      self.products = [
        ...self.products,
        {
          params: [],
          retail_prices: [],
          wholesale_prices: []
        }
      ];
    },

    copyProduct() {
      if (self.products.length === 0) return;
      const copy = JSON.parse(
        JSON.stringify(self.products[self.products.length - 1])
      );
      self.products = [...self.products, copy];
    },

    deleteProduct(index) {
      self.products = self.products.filter((_, i) => i !== index);
    },

    beforeSend() {
      self.result.setValue(self.products);
    },

    convertToWholesale(e, product) {
      e.preventDefault();
      product.wholesale_prices = product.retail_prices.map(obj => ({
        value: obj.value,
        options: obj.options.map(name => ({ name: name, count: 1 }))
      }));
      self.update();
    },

    convertToRetail(e, product) {
      e.preventDefault();
      product.retail_prices = product.wholesale_prices.map(obj => ({
        value: obj.value,
        options: obj.options.map(opt => opt.name)
      }));
      self.update();
    }
  }));

const ProductsDataModel = types.compose(
  "ProductsDataModel",
  ControlBase,
  ClassificationBase,
  PerRegionMixin,
  AnnotationMixin,
  TagAttrs,
  Model
);

const colStyle = { display: "flex", flexDirection: "column", gap: "8px" };

const rowStyle = { display: "flex", alignItems: "start", flexWrap: "wrap" };

const cateoriesSelect = (categories, values, index, onChange) => {
  let items = { ...categories };

  if (index !== 0) {
    for (let i = 0; i < index; i++) {
      const key = values[i];
      if (!key) break;
      items = items[key];
    }
  }

  if (items === undefined) {
    items = [];
  } else if (!Array.isArray(items)) {
    items = Object.keys(items);
  }

  if (items.length === 0) return <span>НЕТ ПОДКАТЕГОРИЙ</span>;

  if (!values[index]) onChange(items[0]);

  return (
    <select
      value={values[index]}
      style={{ marginBottom: "8px", height: "42px" }}
      onChange={e => onChange(e.target.value)}
    >
      {items.map(cat => (
        <option key={cat} value={cat}>
          {cat}
        </option>
      ))}
    </select>
  );
};

const HtxProductsData = inject("store")(
  observer(({ item, store }) => {
    return (
      <div style={{ ...colStyle, gap: "30px" }}>
        {item.products?.map((product, index) => (
          <div key={index}>
            <Divider style={{ marginBottom: "60px" }} />
            <h4>Параметры:</h4>
            <ul>
              {product.params?.map((param, index) => (
                <li key={index} style={{ marginBottom: "28px" }}>
                  <select
                    style={{
                      marginBottom: "8px",
                      height: "42px",
                      fontWeight: 900
                    }}
                    value={param.name}
                    onChange={e => {
                      product.params[index].name = e.target.value;
                      item.update();
                    }}
                  >
                    {item.paramOptions?.map(opt => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                  <button
                    tabIndex={-1}
                    style={{ backgroundColor: "lightcoral" }}
                    onClick={e => item.removeValue(product.params, index)}
                  >
                    x
                  </button>
                  <div style={{ ...rowStyle, gap: "8px" }}>
                    {param.values?.map((val, index) => (
                      <div key={index} style={rowStyle}>
                        {param.name === "категория" ? (
                          cateoriesSelect(
                            item.categories,
                            param.values,
                            index,
                            value => {
                              param.values[index] = value;
                              item.update();
                            }
                          )
                        ) : (
                          <textarea
                            rows={param.name === "описание" ? 4 : 1}
                            key={index}
                            value={val}
                            onChange={e => {
                              param.values[index] = e.target.value;
                              item.update();
                            }}
                          />
                        )}
                        <button
                          tabIndex={-1}
                          style={{ backgroundColor: "lightcoral" }}
                          onClick={e => item.removeValue(param.values, index)}
                        >
                          x
                        </button>
                      </div>
                    ))}
                    <button
                      style={{ backgroundColor: "lightgreen" }}
                      onClick={e => item.addValue(param.values)}
                    >
                      +
                    </button>
                  </div>
                </li>
              ))}
              <button
                style={{ backgroundColor: "lightgreen" }}
                onClick={e =>
                  item.addValue(product.params, {
                    name: item.paramOptions[0],
                    values: []
                  })
                }
              >
                Добавить параметр
              </button>
            </ul>

            <div style={{ display: "flex", gap: "8px", marginBottom: "4px" }}>
              <div>Розничные цены:</div>
              <a href="#" onClick={e => item.convertToWholesale(e, product)}>
                Конвертировать в оптовые
              </a>
            </div>

            <ul>
              {product.retail_prices &&
                product.retail_prices?.map((obj, index) => (
                  <li key={index} style={{ marginBottom: "28px" }}>
                    <input
                      type={"number"}
                      style={{ marginBottom: "8px", fontWeight: 900 }}
                      value={obj.value}
                      onWheel={e => e.target.blur()}
                      onChange={e => {
                        product.retail_prices[index].value =
                          e.target.value && Number(e.target.value);
                        item.update();
                      }}
                    />
                    <button
                      tabIndex={-1}
                      style={{ backgroundColor: "lightcoral" }}
                      onClick={e =>
                        item.removeValue(product.retail_prices, index)
                      }
                    >
                      x
                    </button>
                    <div style={{ ...rowStyle, gap: "8px" }}>
                      {obj.options?.map((opt, index) => (
                        <div key={index} style={rowStyle}>
                          <input
                            value={opt}
                            onChange={e => {
                              obj.options[index] = e.target.value;
                              item.update();
                            }}
                          />
                          <button
                            tabIndex={-1}
                            style={{ backgroundColor: "lightcoral" }}
                            onClick={e => item.removeValue(obj.options, index)}
                          >
                            x
                          </button>
                        </div>
                      ))}
                      <button
                        style={{ backgroundColor: "lightgreen" }}
                        onClick={e => item.addValue(obj.options)}
                      >
                        +
                      </button>
                    </div>
                  </li>
                ))}
              <button
                style={{ backgroundColor: "lightgreen" }}
                onClick={e =>
                  item.addValue(product.retail_prices, {
                    value: 0,
                    options: []
                  })
                }
              >
                Добавить розничную цену
              </button>
            </ul>

            <div style={{ display: "flex", gap: "8px", marginBottom: "4px" }}>
              <div>Оптовые цены:</div>
              <a href="#" onClick={e => item.convertToRetail(e, product)}>
                Конвертировать в розничные
              </a>
            </div>

            <ul>
              {product.wholesale_prices &&
                product.wholesale_prices?.map((obj, index) => (
                  <li key={index} style={{ marginBottom: "28px" }}>
                    <input
                      type={"number"}
                      style={{ marginBottom: "8px", fontWeight: 900 }}
                      value={obj.value}
                      onWheel={e => e.target.blur()}
                      onChange={e => {
                        product.wholesale_prices[index].value =
                          e.target.value && Number(e.target.value);
                        item.update();
                      }}
                    />
                    <button
                      tabIndex={-1}
                      style={{ backgroundColor: "lightcoral" }}
                      onClick={e =>
                        item.removeValue(product.wholesale_prices, index)
                      }
                    >
                      x
                    </button>
                    <div style={{ ...rowStyle, gap: "8px" }}>
                      {obj.options?.map((opt, index) => (
                        <div key={index} style={rowStyle}>
                          <input
                            value={opt.name}
                            onChange={e => {
                              obj.options[index].name = e.target.value;
                              item.update();
                            }}
                          />
                          <input
                            style={{ width: "80px" }}
                            type={"number"}
                            value={opt.count}
                            onWheel={e => e.target.blur()}
                            onChange={e => {
                              obj.options[index].count =
                                e.target.value && Number(e.target.value);
                              item.update();
                            }}
                          />
                          <button
                            tabIndex={-1}
                            style={{ backgroundColor: "lightcoral" }}
                            onClick={e => item.removeValue(obj.options, index)}
                          >
                            x
                          </button>
                        </div>
                      ))}
                      <button
                        style={{ backgroundColor: "lightgreen" }}
                        onClick={e =>
                          item.addValue(obj.options, { name: "", count: 1 })
                        }
                      >
                        +
                      </button>
                    </div>
                  </li>
                ))}
              <button
                style={{ backgroundColor: "lightgreen" }}
                onClick={e =>
                  item.addValue(product.wholesale_prices, {
                    value: 0,
                    options: []
                  })
                }
              >
                Добавить оптовую цену
              </button>
            </ul>
            <button
              style={{ backgroundColor: "red", margin: "16px 0" }}
              onClick={() => item.deleteProduct(index)}
            >
              Удалить товар
            </button>
            <hr />
          </div>
        ))}
        <button
          style={{
            backgroundColor: "lightgreen",
            width: "100%"
          }}
          onClick={item.copyProduct}
        >
          Копировать товар
        </button>
        <button
          style={{
            backgroundColor: "lightgreen",
            width: "100%"
          }}
          onClick={item.addProduct}
        >
          Новый товар
        </button>
      </div>
    );
  })
);

Registry.addTag("productsdata", ProductsDataModel, HtxProductsData);

export { HtxProductsData, ProductsDataModel };
