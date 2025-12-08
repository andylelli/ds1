export interface CeoTools {
    /**
     * Approves a product for the next stage (e.g., Sourcing or Marketing).
     * @param productId The ID of the product to approve.
     */
    approveProduct(productId: string): Promise<void>;

    /**
     * Rejects a product and stops further work on it.
     * @param productId The ID of the product to reject.
     * @param reason The reason for rejection.
     */
    rejectProduct(productId: string, reason: string): Promise<void>;

    /**
     * Emergency stop for the entire simulation.
     */
    pauseSystem(): Promise<void>;
}
