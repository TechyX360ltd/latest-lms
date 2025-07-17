-- Clean up self-gift records that were incorrectly created
-- This removes gift records where sender_id = recipient_id (self-gifts)
-- These should not exist as gifts are meant to be between different users

DELETE FROM gifts 
WHERE sender_id = recipient_id;

-- Also clean up any gift records with gift_type = 'store_purchase'
-- as these were incorrectly created during store purchases

DELETE FROM gifts 
WHERE gift_type = 'store_purchase'; 