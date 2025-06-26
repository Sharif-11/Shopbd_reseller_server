export interface OrderProductData {
  id: number
  imageUrl: string
  imageId: number
  quantity: number
  sellingPrice: number
  selectedVariants?: {
    [key: string]: string | number
  }
}
export interface OrderData {
  shopId: number
  customerName: string
  customerPhoneNo: string
  customerZilla: string
  customerUpazilla: string
  deliveryAddress: string
  comments?: string
  products: OrderProductData[]
}
