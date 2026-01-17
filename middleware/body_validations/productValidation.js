const { check } = require('express-validator');

const productValidation = {
    'create:product' : [
        check('name', 'name does not exist.').not().isEmpty(),
        check('price', 'price does not exist.').not().isEmpty(),
        check('quantity', 'quantity does not exist.').optional(),
        check('description', 'description does not exist.').optional(),
        check('active', 'active does not exist.').optional(),
    ],
    'update:product': [
        check('name', 'name does not exist.').optional(),
        check('description', 'description does not exist.').optional(),
        check('price', 'price does not exist.').optional(),
        check('quantity', 'quantity does not exist.').optional(),
        check('active', 'active does not exist.').optional(),
    ],
    // Mantenemos las otras validaciones por si las necesitas después
    'create:productClassification' : [
        check('type', 'type does not exist.').not().isEmpty(),
        check('name', 'name does not exist.').not().isEmpty(),
    ],
    'update:productClassification': [
        check('id','id does not exist.').not().isEmpty(),
        check('name', 'name does not exist.').not().isEmpty(),
        check('active', 'active does not exist.').not().isEmpty(),
        check('sort', 'sort does not exist.').not().isEmpty(),
        check('parent', 'parent does not exist.').not().isEmpty(),
    ],
    'create:massiveProduct' : [
        check('option', 'option does not exist.').not().isEmpty(),
        check('partnerId', 'partnerId does not exist.').not().isEmpty(),
        check('branches[*]', 'branches does not exist.').not().isEmpty(),
    ],
    'create:branchProduct': [
        check('id', 'id does not exist.').not().isEmpty(),
        check('id_branch', 'id_branch does not exist.').not().isEmpty(),
        check('discount', 'discount does not exist.').not().isEmpty(),
        check('price', 'price does not exist.').not().isEmpty(),
        check('enabled', 'enabled does not exist.').not().isEmpty(),
        check('visible', 'visible does not exist.').not().isEmpty(),
    ],
    'update:branchProduct': [
        check('id', 'id does not exist.').not().isEmpty(),
        check('branchs_id', 'branchs_id does not exist.').not().isEmpty(),
        check('id_branch', 'id_branch does not exist.').not().isEmpty(),
        check('discount', 'discount does not exist.').not().isEmpty(),
        check('price', 'price does not exist.').not().isEmpty(),
        check('enabled', 'enabled does not exist.').not().isEmpty(),
        check('visible', 'visible does not exist.').not().isEmpty(),
    ],
    'delete:branchProduct': [
        check('id', 'id does not exist.').not().isEmpty(),
        check('branchs_id', 'branchs_id does not exist.').not().isEmpty(),
    ],
    'create:productSchedule': [
        check('id', 'id does not exist.').not().isEmpty(),
        check('branches_schedule', 'branch_id does not exist.').not().isEmpty(),
        check('schedule', 'schedule does not exist.').not().isEmpty(),
    ],
    'update:productSchedule': [
        check('product_id', 'id does not exist.').not().isEmpty(),
        check('branch_id', 'branch_id does not exist.').not().isEmpty(),
        check('previousTimes', 'previousTimes does not exist.').not().isEmpty(),
    ],
    'update:massiveproduct': [
        check('partnerId', 'partnerId does not exist.').not().isEmpty(),
        check('productsId', 'producstId does not exist.').not().isEmpty(),
    ],
    'update:massiveclassificationsproduct': [
        check('partnerId', 'partnerId does not exist.').not().isEmpty(),
        check('productsIds', 'productsIds does not exist.').not().isEmpty(),
        check('classificationsIds', 'classificationsIds does not exist.').not().isEmpty(),
    ],
    'update:massivepricebranchs': [
        check('productsIds', 'productsIds does not exist.').not().isEmpty(),
        check('price', 'price does not exist.').not().isEmpty(),
    ],
    'update:massiveoptionsproduct': [
        check('partnerId', 'partnerId does not exist.').not().isEmpty(),
        check('productId', 'productId does not exist.').not().isEmpty(),
        check('optionId', 'optionId does not exist.').not().isEmpty(),
        check('productCopy', 'productCopy does not exist.').not().isEmpty(),
    ]
}

module.exports = {
    productValidation
}