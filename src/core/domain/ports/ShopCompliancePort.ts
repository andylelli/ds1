export interface ShopCompliancePort {
    /**
     * Checks if a product complies with store policies and prohibited item lists.
     * This is a READ-ONLY operation safe for Research Agents.
     */
    checkPolicy(productName: string, description: string): Promise<{ allowed: boolean; reason?: string }>;
}
