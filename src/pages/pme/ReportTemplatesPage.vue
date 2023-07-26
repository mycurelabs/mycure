<template lang="pug">
generic-page(
  skeleton="table"
  padding
  :loading="initializing"
)
  q-table(
    v-model:pagination="pagination"
    ref="tableRef"
    icon-first-page="la la-angle-double-left"
    icon-last-page="la la-angle-double-right"
    icon-next-page="la la-angle-right"
    icon-prev-page="la la-angle-left"
    row-key="status"
    color="primary"
    :columns="columns"
    :dense="$q.screen.lt.md"
    :rows-per-page-options="rowsPerPageOption"
    :rows="rows"
    :loading="loading"
    :visible-columns="visibleColumns"
    @request="onPaginate"
    @isRowSelected="onRowSelect"
  ).shadow-1
    //- Title
    template(v-slot:top-left)
      q-toolbar-title
        q-icon(
          size="25px"
          name="las la-clipboard"
          style="margin-bottom: 5px;"
        ).text-primary.q-mr-sm
        span Report Templates

    //- Search and filter
    template(v-slot:top-right)
      q-input(
        v-model="searchText"
        label="Search Template Name"
        style="min-width: 300px"
        clear-icon="las la-times"
        debounce="500"
        outlined
        dense
        use-input
        clearable
      ).q-mr-sm
        template(v-slot:loading)
          q-spinner(
            color="primary"
            size="20"
          )
        template(v-slot:prepend)
          q-icon(name="la la-search")

      q-btn(
        label="Add"
        color="primary"
        icon="la la-plus"
        outline
        no-caps
        :to="{ name: 'report-template' }"
      ).q-mr-sm

      q-btn(
        label="Import/Export"
        color="primary"
        outline
        no-caps
      )
        q-menu
          q-list
            q-item(clickable @click="importFromJSON")
              q-item-section Import from JSON
            q-item(clickable @click="exportToJSON")
              q-item-section Export to JSON

    //- Table body
    template(v-slot:body="props")
      q-tr(:props="props" class="hover:bg-grey-3 cursor-pointer" @click="onRowSelect(props.row)")
        q-td(key="name" :props="props")
          span {{props.row.name || '-'}}
          q-badge(v-if="props.row.hiddenAt" color="warning").q-ml-sm Archived
        q-td(key="description" :props="props")
          span {{props.row.description || '-'}}

    //- No data
    template(v-slot:no-data)
      div(style="height: 200px").row.full-width.justify-center.items-center
        div.col-xs-12.text-center
          q-icon(name="la la-meh" size="60px").text-grey
          h2.text-grey.text-h6 No Report Templates found

input(style="visibility: hidden;" ref="fileInput" type="file" accept=".json" @change="onFileChange")
</template>

<script>
import _ from 'lodash';
import { computed, onMounted, ref, watch } from 'vue';
import { getFormTemplates } from '@/services/form-templates';
import { readInputFile } from '@/utils/medical-records-formatter';
import { TABLE_ROWS_PER_PAGE_OPTION } from '@/constants/global';
import { useHelpers } from '@/composables/helpers';
import { useRouter } from 'vue-router';
import { useQuasarMixins } from '@/composables/quasar-mixins';
import { useUserStore } from '@/stores/current-user';
import { sdk } from 'src/boot/mycure';
import GenericPage from '@/components/commons/GenericPage';
import SearchFormTemplates from '@/components/commons/search/SearchFormTemplates';
import WorklistTableFilterDialog from '@/components/pme/WorklistTableFilterDialog';

export default {
  components: {
    GenericPage,
    SearchFormTemplates,
    WorklistTableFilterDialog,
  },
  setup () {
    // Helpers
    const router = useRouter();
    const { tableColumnBuilder } = useHelpers();
    const { showSnack } = useQuasarMixins();
    // Stores
    const userStore = useUserStore();
    // Refs
    const reportTemplates = ref([]);
    const searchText = ref('');
    const initializing = ref(false);
    const loading = ref(false);
    const tableRef = ref(null);
    const totalItems = ref(0);
    const rowsPerPageOption = ref(TABLE_ROWS_PER_PAGE_OPTION);
    const pagination = ref({
      page: 0,
      rowsPerPage: rowsPerPageOption.value[0],
      rowsNumber: 0,
    });
    // Computed
    const activeOrganization = computed(() => userStore.$state.userActiveOrganization);
    const rows = computed(() => {
      if (!reportTemplates.value?.length) return [];
      return reportTemplates.value.map((item) => {
        return {
          name: item.name,
          description: item.description,
          hiddenAt: item.hiddenAt,
          $data: item,
        };
      });
    });

    const columns = tableColumnBuilder([
      {
        name: 'name',
        field: 'name',
        label: 'Template Name',
      },
      {
        name: 'description',
        field: 'description',
        label: 'Description',
      },
    ]);

    const visibleColumns = ref(columns.map(column => column.name));

    async function init (paginationOpts) {
      try {
        loading.value = true;
        const page = paginationOpts?.page || 1;
        const rowsPerPage = paginationOpts?.rowsPerPage || rowsPerPageOption.value[0];
        const query = {
          facility: activeOrganization.value.id,
          limit: rowsPerPage,
          skip: (page - 1) * rowsPerPage,
        };

        if (searchText.value) {
          query.searchText = searchText.value;
        }

        const { items, total } = await getFormTemplates(query);

        reportTemplates.value = items;
        totalItems.value = total;
        pagination.value.page = page;
        pagination.value.rowsPerPage = rowsPerPage;
        pagination.value.rowsNumber = total;
      } catch (e) {
        console.error(e);
      } finally {
        loading.value = false;
        initializing.value = false;
      }
    }

    watch(searchText, (val) => {
      tableRef.value.requestServerInteraction();
    });

    // Event functions
    function onPaginate (props) {
      const { page, rowsPerPage } = props.pagination;
      init({ page, rowsPerPage });
    }

    function onRowSelect (row) {
      console.warn('row', row);
      router.push({
        name: 'report-template',
        params: {
          reportTemplate: row.$data.id,
        },
      });
    }

    onMounted(() => {
      tableRef.value.requestServerInteraction();
    });

    const fileInput = ref(null);
    function importFromJSON () {
      console.warn('importFromJSON');
      fileInput.value.click();
    }

    async function onFileChange (event) {
      try {
        const json = await readInputFile(event, 'text');

        const payload = JSON.parse(json);
        const normalizedPayload = _.isArray(payload) ? payload : [payload];
        const contextualizedPayload = _.map(normalizedPayload, template => ({
          ...template,
          facility: activeOrganization.value.id,
        }));

        await sdk.service('form-templates').create(contextualizedPayload);
        await tableRef.value.requestServerInteraction();
        showSnack({
          message: 'Form templates imported!',
          color: 'positive',
        });
      } catch (error) {
        console.error(error);
        showSnack({
          message: error.message || 'Something went wrong! Please try again.',
          color: 'negative',
        });
      } finally {
        this.loading = false;
      }
    }

    function exportToJSON () {
      console.warn('exportToJSON');
      const a = document.createElement('a');
      const data = _.map(reportTemplates.value, temp => _.pick(temp, 'type',
        'subtype', 'name', 'description', 'template', 'items', 'tags',
        'meta', 'config'));
      const json = JSON.stringify(data);
      a.setAttribute('href', 'data:text/plain;charset=utf-u,' + window.encodeURIComponent(json));
      a.setAttribute('download', 'pme-report-templates.json');
      a.click();
    }

    return {
      columns,
      initializing,
      fileInput,
      loading,
      pagination,
      rows,
      rowsPerPageOption,
      searchText,
      tableRef,
      totalItems,
      visibleColumns,
      // methods
      init,
      onPaginate,
      onRowSelect,
      importFromJSON,
      exportToJSON,
      onFileChange,
    };
  },
};
</script>

<style lang="css" scoped>
.wrap-content {
  word-wrap: break-word;
  white-space: normal !important;
  font-weight: bold;
}
</style>
