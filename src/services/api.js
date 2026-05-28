import { productsService } from './db';

export const adminApi = {
  async getProducts() {
    return productsService.getAll();
  },

  async addProduct(product) {
    return productsService.add(product);
  },

  async removeProduct(id) {
    await productsService.remove(id);
  },
};
